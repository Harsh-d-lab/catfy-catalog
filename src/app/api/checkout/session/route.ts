import { NextRequest, NextResponse } from 'next/server'
import { getUser, getUserProfile } from '@/lib/auth'
import { stripe, STRIPE_PLANS, createCheckoutSession, createCustomer } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { BillingCycle, SubscriptionStatus, Prisma } from '@prisma/client'

const createSessionSchema = z.object({
  plan: z.enum(['monthly', 'yearly']),
  couponCode: z.string().optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const profile = await getUserProfile(user.id)
    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { plan, couponCode, successUrl, cancelUrl } = createSessionSchema.parse(body)

    const selectedPlan = STRIPE_PLANS[plan]
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    const finalSuccessUrl = successUrl || `${baseUrl}/dashboard?success=true`
    const finalCancelUrl = cancelUrl || `${baseUrl}/billing?canceled=true`

    // Validate coupon if provided
    let couponId: string | undefined
    let discountAmount = 0
    let finalAmount = selectedPlan.amount

    if (couponCode) {
      const couponValidation = await fetch(`${baseUrl}/api/coupons/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('Authorization') || '',
        },
        body: JSON.stringify({
          code: couponCode,
          billingCycle: plan.toUpperCase(),
          amount: selectedPlan.amount,
        }),
      })

      if (couponValidation.ok) {
        const couponResult = await couponValidation.json()
        if (couponResult.valid) {
          // Create Stripe coupon if it doesn't exist
          try {
            await stripe.coupons.retrieve(couponCode.toUpperCase())
            couponId = couponCode.toUpperCase()
          } catch {
            // Create the coupon in Stripe
            const coupon = couponResult.coupon
            await stripe.coupons.create({
              id: coupon.code,
              name: coupon.name,
              [coupon.type === 'PERCENTAGE' ? 'percent_off' : 'amount_off']: 
                coupon.type === 'PERCENTAGE' ? coupon.value : coupon.value * 100,
              duration: 'once',
              ...(coupon.type === 'FIXED' && { currency: 'usd' }),
            })
            couponId = coupon.code
          }
          
          discountAmount = couponResult.discount.amount
          finalAmount = couponResult.finalAmount
        }
      }
    }

    // Get or create Stripe customer
    let customerId = profile.stripeCustomerId
    
    if (!customerId) {
      const customer = await createCustomer({
        email: user.email!,
        name: profile.fullName || undefined,
        metadata: {
          profileId: profile.id,
          accountType: profile.accountType,
        },
      })
      
      customerId = customer.id
      
      // Update profile with Stripe customer ID
      await prisma.profile.update({
        where: { id: profile.id },
        data: { stripeCustomerId: customerId },
      })
    }

    // Handle free subscriptions (after discount)
    if (finalAmount <= 0) {
      // Create subscription directly in database
      const subscription = await prisma.subscription.create({
        data: {
          profileId: profile.id,
          stripeSubscriptionId: `free_${Date.now()}`,
          stripePriceId: selectedPlan.priceId,
          status: SubscriptionStatus.ACTIVE,
          amount: new Prisma.Decimal(finalAmount),
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(
            Date.now() + (plan === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000
          ),
          billingCycle: plan === 'yearly' ? BillingCycle.YEARLY : BillingCycle.MONTHLY,
        },
      })

      // Record coupon usage if applicable
      if (couponCode) {
        await prisma.$transaction(async (tx) => {
          const coupon = await tx.coupon.findUnique({
            where: { code: couponCode.toUpperCase() },
          })

          if (coupon) {
            await tx.couponUsage.create({
              data: {
                couponId: coupon.id,
                profileId: profile.id,
                subscriptionId: subscription.id,
              },
            })

            await tx.coupon.update({
              where: { id: coupon.id },
              data: { usedCount: { increment: 1 } },
            })
          }
        })
      }

      return NextResponse.json({
        success: true,
        subscriptionId: subscription.id,
        message: 'Free subscription created successfully',
        redirectUrl: finalSuccessUrl,
      })
    }

    // Create Stripe checkout session
    const session = await createCheckoutSession({
      customerId,
      priceId: selectedPlan.priceId,
      successUrl: finalSuccessUrl,
      cancelUrl: finalCancelUrl,
      couponId,
      metadata: {
        profileId: profile.id,
        plan,
        couponCode: couponCode || '',
      },
    })

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      success: true,
    })
  } catch (error) {
    console.error('Checkout session creation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    const message = error instanceof Error ? error.message : 'Failed to create checkout session'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}