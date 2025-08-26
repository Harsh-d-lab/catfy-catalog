import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUser } from '@/lib/auth'
import { z } from 'zod'

const useCouponSchema = z.object({
  couponId: z.string().min(1, 'Coupon ID is required'),
  subscriptionId: z.string().min(1, 'Subscription ID is required'),
  discountAmount: z.number().min(0, 'Discount amount must be non-negative'),
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
    const { couponId, subscriptionId, discountAmount } = useCouponSchema.parse(body)

    // Use atomic transaction to record coupon usage
    const result = await prisma.$transaction(async (tx) => {
      // Get user profile
      const profile = await tx.profile.findUnique({
        where: { id: user.id },
        select: { id: true }
      })

      if (!profile) {
        throw new Error('Profile not found')
      }

      // Verify the coupon exists and is still valid
      const coupon = await tx.coupon.findUnique({
        where: { id: couponId },
        include: {
          usages: {
            where: { profileId: profile.id }
          }
        }
      })

      if (!coupon) {
        throw new Error('Coupon not found')
      }

      if (!coupon.isActive) {
        throw new Error('Coupon is no longer active')
      }

      // Check if user has already used this coupon
      if (coupon.usages.length > 0) {
        throw new Error('Coupon has already been used by this user')
      }

      // Verify the subscription exists and belongs to the user
      const subscription = await tx.subscription.findUnique({
        where: { 
          id: subscriptionId,
          profileId: profile.id
        }
      })

      if (!subscription) {
        throw new Error('Subscription not found or does not belong to user')
      }

      // Create coupon usage record
      const couponUsage = await tx.couponUsage.create({
        data: {
          couponId,
          profileId: profile.id,
          subscriptionId,
          usedAt: new Date()
        }
      })

      // Update coupon used count
      await tx.coupon.update({
        where: { id: couponId },
        data: {
          usedCount: {
            increment: 1
          }
        }
      })

      return {
        success: true,
        couponUsage: {
          id: couponUsage.id,
          couponCode: coupon.code,
          usedAt: couponUsage.usedAt
        }
      }
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('Coupon usage error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    const message = error instanceof Error ? error.message : 'Failed to record coupon usage'
    return NextResponse.json(
      { error: message, success: false },
      { status: 400 }
    )
  }
}

// GET endpoint to retrieve user's coupon usage history
export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { id: true }
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    const couponUsages = await prisma.couponUsage.findMany({
      where: { profileId: profile.id },
      include: {
        coupon: {
          select: {
            code: true,
            name: true,
            description: true,
            type: true,
            value: true
          }
        },
        subscription: {
          select: {
            id: true,
            billingCycle: true,
            status: true
          }
        }
      },
      orderBy: {
        usedAt: 'desc'
      }
    })

    return NextResponse.json({
      couponUsages: couponUsages.map(usage => ({
        id: usage.id,
        coupon: usage.coupon,
        subscription: usage.subscription,
        usedAt: usage.usedAt
      }))
    })

  } catch (error) {
    console.error('Coupon usage history error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve coupon usage history' },
      { status: 500 }
    )
  }
}