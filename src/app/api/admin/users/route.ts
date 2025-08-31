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

    // Fetch all users with their profiles and subscription data
    const users = await prisma.profile.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        updatedAt: true,
        subscriptions: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            plan: true,
            status: true,
            billingCycle: true,
            amount: true,
            createdAt: true,
            currentPeriodEnd: true
          }
        },
        catalogues: {
          select: {
            id: true,
            name: true,
            isPublic: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            catalogues: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform the data for admin dashboard
    const transformedUsers = users.map(user => {
      const subscription = user.subscriptions[0]
      return {
        id: user.id,
        email: user.email,
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A',
        companyName: null, // Not available in current schema
        subscriptionPlan: subscription ? 
          (subscription.billingCycle === 'MONTHLY' ? 'monthly' : 'yearly') : 'free',
        subscriptionStatus: subscription ? 
          (subscription.status === 'ACTIVE' ? 'active' : 'inactive') : 'inactive',
        createdAt: user.createdAt.toISOString(),
        lastLoginAt: null, // Not tracked in current schema
        catalogueCount: user._count.catalogues,
        isActive: true // Assuming all users are active by default
      }
    })

    return NextResponse.json({
      users: transformedUsers,
      total: transformedUsers.length
    })

  } catch (error) {
    console.error('Admin users fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users data' },
      { status: 500 }
    )
  }
}