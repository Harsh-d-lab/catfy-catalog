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

    // Get current date for monthly calculations
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    // Fetch all statistics in parallel
    const [totalUsers, totalCatalogues, activeSubscriptions, totalExports, monthlyUsers, lastMonthUsers] = await Promise.all([
      // Total users
      prisma.profile.count(),
      
      // Total catalogues
      prisma.catalogue.count(),
      
      // Active subscriptions with revenue
      prisma.subscription.findMany({
        where: { status: 'ACTIVE' },
        select: { amount: true, billingCycle: true }
      }),
      
      // Total exports
      prisma.export.count(),
      
      // Users created this month
      prisma.profile.count({
        where: {
          createdAt: {
            gte: startOfMonth
          }
        }
      }),
      
      // Users created last month
      prisma.profile.count({
        where: {
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth
          }
        }
      })
    ])

    // Calculate revenue
    const totalRevenue = activeSubscriptions.reduce((sum, sub) => sum + (sub.amount ? Number(sub.amount) : 0), 0)
    
    // Calculate monthly growth
    const monthlyGrowth = lastMonthUsers > 0 
      ? ((monthlyUsers - lastMonthUsers) / lastMonthUsers) * 100 
      : monthlyUsers > 0 ? 100 : 0

    // Count subscription types
    const freeUsers = totalUsers - activeSubscriptions.length
    const paidUsers = activeSubscriptions.length

    const stats = {
      totalUsers,
      totalCatalogues,
      totalRevenue: Math.round(totalRevenue * 100) / 100, // Round to 2 decimal places
      monthlyGrowth: Math.round(monthlyGrowth * 100) / 100,
      activeSubscriptions: activeSubscriptions.length,
      freeUsers,
      paidUsers,
      totalExports
    }

    return NextResponse.json({ stats })

  } catch (error) {
    console.error('Admin stats fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch admin statistics' },
      { status: 500 }
    )
  }
}