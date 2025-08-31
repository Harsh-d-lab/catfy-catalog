import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { SubscriptionPlan } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile and subscription
    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        catalogues: {
          select: { id: true }
        },
        exports: {
          where: {
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) // Start of current month
            }
          },
          select: { id: true }
        }
      }
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Handle admin user with unlimited access
    if (user.email === 'admin@catfy.com') {
      return NextResponse.json({
        plan: SubscriptionPlan.BUSINESS, // Give admin users the highest plan
        usage: {
          catalogues: profile.catalogues.length,
          monthlyExports: profile.exports.length
        },
        subscription: {
          id: 'admin-subscription',
          plan: SubscriptionPlan.BUSINESS,
          status: 'ACTIVE',
          amount: 0,
          billingCycle: 'MONTHLY',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          cancelAtPeriodEnd: false,
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          stripePriceId: null,
          profileId: profile.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      })
    }

    // Get current subscription plan
    const currentSubscription = profile.subscriptions[0]
    const plan = currentSubscription?.plan || SubscriptionPlan.FREE

    // Calculate usage
    const usage = {
      catalogues: profile.catalogues.length,
      monthlyExports: profile.exports.length
    }

    return NextResponse.json({
      plan,
      usage,
      subscription: currentSubscription || null
    })

  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}