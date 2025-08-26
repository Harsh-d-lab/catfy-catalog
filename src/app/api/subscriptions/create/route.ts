import { NextRequest, NextResponse } from 'next/server'
import { getUser, getUserProfile } from '@/lib/auth'
import { stripe, STRIPE_PLANS, createSubscription, createCustomer } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { BillingCycle, SubscriptionStatus, Prisma } from '@prisma/client'

const createSubscriptionSchema = z.object({
  plan: z.enum(['monthly', 'yearly']),
  paymentMethodId: z.string(),
  couponCode: z.string().optional(),
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
    const { plan, paymentMethodId, couponCode } = createSubscriptionSchema.parse(body)

    const selectedPlan = STRIPE_PLANS[plan]

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

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    })

    // Set as default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    })

    // Validate coupon if provided
    let couponId: string | undefined
    let discountAmount = 0

    if (couponCode) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const couponValidation = await fetch(`${baseUrl}/api/coupons/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('Authorization') || '',
        },
        body: JSON.stringify({
          code: couponCode,
          billingCycle: plan.toUpperCase(),
          amount: new Prisma.Decimal(selectedPlan.amount),
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
        }
      }
    }

    // Create Stripe subscription
    const stripeSubscription = await createSubscription({
      customerId,
      priceId: selectedPlan.priceId,
      couponId,
      metadata: {
        profileId: profile.id,
        plan,
        couponCode: couponCode || '',
      },
    })

    // Map Stripe status to our enum
    const mapStripeStatus = (status: string): SubscriptionStatus => {
      switch (status) {
        case 'active':
          return 'ACTIVE'
        case 'past_due':
          return 'PAST_DUE'
        case 'canceled':
          return 'CANCELED'
        case 'unpaid':
          return 'UNPAID'
        case 'incomplete':
        case 'incomplete_expired':
          return 'INCOMPLETE'
        case 'trialing':
          return 'TRIALING'
        default:
          return 'INCOMPLETE'
      }
    }

    // Create subscription in database
    const subscription = await prisma.$transaction(async (tx) => {
      const newSubscription = await tx.subscription.create({
        data: {
          profileId: profile.id,
          stripeSubscriptionId: stripeSubscription.id,
          stripeCustomerId: customerId,
          stripePriceId: selectedPlan.priceId,
          status: mapStripeStatus(stripeSubscription.status),
          amount: new Prisma.Decimal(selectedPlan.amount),
          currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
          billingCycle: plan === 'yearly' ? BillingCycle.YEARLY : BillingCycle.MONTHLY,
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        },
      })

      // Record coupon usage if applicable
      if (couponCode && discountAmount > 0) {
        const coupon = await tx.coupon.findUnique({
          where: { code: couponCode.toUpperCase() },
        })

        if (coupon) {
          await tx.couponUsage.create({
            data: {
              couponId: coupon.id,
              profileId: profile.id,
              subscriptionId: newSubscription.id,
            },
          })

          await tx.coupon.update({
            where: { id: coupon.id },
            data: { usedCount: { increment: 1 } },
          })
        }
      }

      return newSubscription
    })

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        billingCycle: subscription.billingCycle,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      },
      stripeSubscription: {
        id: stripeSubscription.id,
        status: stripeSubscription.status,
        clientSecret: typeof stripeSubscription.latest_invoice === 'object' && stripeSubscription.latest_invoice?.payment_intent && typeof stripeSubscription.latest_invoice.payment_intent === 'object' ? stripeSubscription.latest_invoice.payment_intent.client_secret : null,
      },
    })
  } catch (error) {
    console.error('Subscription creation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    // Handle Stripe errors
    if (error && typeof error === 'object' && 'type' in error) {
      const stripeError = error as any
      switch (stripeError.type) {
        case 'StripeCardError':
          return NextResponse.json(
            { error: 'Your card was declined. Please try a different payment method.' },
            { status: 400 }
          )
        case 'StripeInvalidRequestError':
          return NextResponse.json(
            { error: 'Invalid payment information provided.' },
            { status: 400 }
          )
        default:
          break
      }
    }

    const message = error instanceof Error ? error.message : 'Failed to create subscription'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}