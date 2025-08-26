import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'
import { z } from 'zod'
import { BillingCycle, SubscriptionStatus } from '@prisma/client'

const validateCouponSchema = z.object({
  code: z.string().min(1, 'Coupon code is required'),
  billingCycle: z.enum(['MONTHLY', 'YEARLY']),
  amount: z.number().positive('Amount must be positive'),
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

    const body = await request.json()
    const { code, billingCycle, amount } = validateCouponSchema.parse(body)

    // Use Prisma transaction for atomic coupon validation and reservation
    const result = await prisma.$transaction(async (tx) => {
      // Find the coupon
      const coupon = await tx.coupon.findUnique({
        where: { code: code.toUpperCase() },
        include: {
          usages: {
            where: { profileId: user.id },
          },
        },
      })

      if (!coupon) {
        throw new Error('Invalid coupon code')
      }

      if (!coupon.isActive) {
        throw new Error('This coupon is no longer active')
      }

      // Check if coupon has expired
      const now = new Date()
      if (coupon.validUntil && coupon.validUntil < now) {
        throw new Error('This coupon has expired')
      }

      if (coupon.validFrom > now) {
        throw new Error('This coupon is not yet valid')
      }

      // Check billing cycle restrictions
      if (
        coupon.allowedBillingCycles.length > 0 &&
        !coupon.allowedBillingCycles.includes(billingCycle as BillingCycle)
      ) {
        const allowedCycles = coupon.allowedBillingCycles.join(', ').toLowerCase()
        throw new Error(`This coupon is only valid for ${allowedCycles} billing`)
      }

      // Check if user has already used this coupon
      if (coupon.usages.length >= coupon.limitPerCustomer) {
        throw new Error('You have already used this coupon')
      }

      // Check total usage limit
      if (coupon.limitTotal && coupon.usedCount >= coupon.limitTotal) {
        throw new Error('This coupon has reached its usage limit')
      }

      // Special logic for FIRST100 coupon
      if (coupon.code === 'FIRST100') {
        // Get user profile to check creation date
        const profile = await tx.profile.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            createdAt: true
          }
        })

        if (!profile) {
          throw new Error('Profile not found')
        }

        // Check if this is truly a new user (created within last 24 hours)
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
        if (new Date(profile.createdAt) < dayAgo) {
          throw new Error('FIRST100 coupon is only valid for new users within 24 hours of signup')
        }

        // Check if user has any existing subscriptions
        const existingSubscription = await tx.subscription.findFirst({
          where: {
            profileId: profile.id,
            status: {
              in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCELED, SubscriptionStatus.PAST_DUE]
            }
          }
        })

        if (existingSubscription) {
          throw new Error('FIRST100 coupon is only valid for first-time subscribers')
        }
      }

      // Calculate discount
      let discountAmount = 0
      if (coupon.type === 'PERCENTAGE') {
        discountAmount = (amount * Number(coupon.value)) / 100
      } else {
        discountAmount = Number(coupon.value)
      }

      // Ensure discount doesn't exceed the amount
      discountAmount = Math.min(discountAmount, amount)

      const finalAmount = Math.max(0, amount - discountAmount)

      return {
        valid: true,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          name: coupon.name,
          description: coupon.description,
          type: coupon.type,
          value: Number(coupon.value),
        },
        discount: {
          amount: discountAmount,
          percentage: coupon.type === 'PERCENTAGE' ? Number(coupon.value) : null,
        },
        originalAmount: amount,
        finalAmount,
        savings: discountAmount,
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Coupon validation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    const message = error instanceof Error ? error.message : 'Failed to validate coupon'
    return NextResponse.json(
      { error: message, valid: false },
      { status: 400 }
    )
  }
}

// GET endpoint to check coupon without validation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json(
        { error: 'Coupon code is required' },
        { status: 400 }
      )
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        type: true,
        value: true,
        isActive: true,
        isPublic: true,
        limitTotal: true,
        usedCount: true,
        allowedBillingCycles: true,
        validFrom: true,
        validUntil: true,
      },
    })

    if (!coupon) {
      return NextResponse.json(
        { error: 'Coupon not found' },
        { status: 404 }
      )
    }

    // Calculate remaining uses if public
    const remainingUses = coupon.isPublic && coupon.limitTotal 
      ? Math.max(0, coupon.limitTotal - coupon.usedCount)
      : null

    const now = new Date()
    const isExpired = coupon.validUntil ? coupon.validUntil < now : false
    const isNotYetValid = coupon.validFrom > now

    return NextResponse.json({
      coupon: {
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        description: coupon.description,
        type: coupon.type,
        value: Number(coupon.value),
        allowedBillingCycles: coupon.allowedBillingCycles,
        validFrom: coupon.validFrom,
        validUntil: coupon.validUntil,
        remainingUses,
      },
      status: {
        isActive: coupon.isActive,
        isExpired,
        isNotYetValid,
        isAvailable: coupon.isActive && !isExpired && !isNotYetValid,
      },
    })
  } catch (error) {
    console.error('Coupon lookup error:', error)
    return NextResponse.json(
      { error: 'Failed to lookup coupon' },
      { status: 500 }
    )
  }
}