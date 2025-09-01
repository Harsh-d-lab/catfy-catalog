import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // Authenticate user via Supabase
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin - only admin@catfy.com is allowed
    if (user.email !== 'admin@catfy.com') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Fetch all subscriptions with user data
    const subscriptions = await prisma.subscription.findMany({
      select: {
        id: true,
        plan: true,
        status: true,
        billingCycle: true,
        amount: true,
        currency: true,
        stripeSubscriptionId: true,
        stripeCustomerId: true,
        createdAt: true,
        updatedAt: true,
        currentPeriodEnd: true,
        canceledAt: true,
        profile: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            createdAt: true
          }
        },
        couponUsages: {
          select: {
            id: true,
            usedAt: true,
            coupon: {
              select: {
                code: true,
                name: true,
                type: true,
                value: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate subscription statistics
    const stats = {
      total: subscriptions.length,
      active: subscriptions.filter(s => s.status === 'ACTIVE').length,
      cancelled: subscriptions.filter(s => s.status === 'CANCELED').length,
      trialing: subscriptions.filter(s => s.status === 'TRIALING').length,
      pastDue: subscriptions.filter(s => s.status === 'PAST_DUE').length,
      totalRevenue: subscriptions
        .filter(s => s.status === 'ACTIVE')
        .reduce((sum, s) => sum + (s.amount ? Number(s.amount) : 0), 0),
      monthlyRevenue: subscriptions
        .filter(s => s.status === 'ACTIVE' && s.billingCycle === 'MONTHLY')
        .reduce((sum, s) => sum + (s.amount ? Number(s.amount) : 0), 0),
      yearlyRevenue: subscriptions
        .filter(s => s.status === 'ACTIVE' && s.billingCycle === 'YEARLY')
        .reduce((sum, s) => sum + (s.amount ? Number(s.amount) : 0), 0)
    }

    // Transform the data for admin dashboard
    const transformedSubscriptions = subscriptions.map(subscription => ({
      id: subscription.id,
      plan: subscription.billingCycle === 'MONTHLY' ? 'monthly' : 'yearly',
      status: subscription.status === 'ACTIVE' ? 'active' : 
               subscription.status === 'CANCELED' ? 'cancelled' : 'inactive',
      amount: subscription.amount ? Number(subscription.amount) : 0,
      createdAt: subscription.createdAt.toISOString(),
      cancelledAt: subscription.canceledAt?.toISOString() || null,
      user: {
        fullName: `${subscription.profile.firstName || ''} ${subscription.profile.lastName || ''}`.trim() || 'N/A',
        email: subscription.profile.email
      }
    }))

    return NextResponse.json({
      subscriptions: transformedSubscriptions,
      stats,
      total: transformedSubscriptions.length
    })

  } catch (error) {
    console.error('Admin subscriptions fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions data' },
      { status: 500 }
    )
  }
}