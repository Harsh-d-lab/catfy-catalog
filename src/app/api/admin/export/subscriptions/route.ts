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

    // Fetch all subscriptions with related data
    const subscriptions = await prisma.subscription.findMany({
      include: {
        profile: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            companyName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform data for CSV export
    const csvData = subscriptions.map(subscription => ({
      'Subscription ID': subscription.id,
      'User Email': subscription.profile.email,
      'User Name': `${subscription.profile.firstName || ''} ${subscription.profile.lastName || ''}`.trim() || 'N/A',
      'Company Name': subscription.profile.companyName || 'N/A',
      'Plan': subscription.plan,
      'Status': subscription.status,
      'Billing Cycle': subscription.billingCycle,
      'Amount': subscription.amount ? Number(subscription.amount) : 0,
      'Currency': subscription.currency,
      'Current Period Start': subscription.currentPeriodStart?.toISOString() || 'N/A',
      'Current Period End': subscription.currentPeriodEnd?.toISOString() || 'N/A',
      'Trial End': subscription.trialEnd?.toISOString() || 'N/A',
      'Canceled At': subscription.canceledAt?.toISOString() || 'N/A',
      'Created At': subscription.createdAt.toISOString(),
      'Updated At': subscription.updatedAt.toISOString()
    }))

    // Convert to CSV format
    if (csvData.length === 0) {
      return NextResponse.json(
        { error: 'No subscription data found' },
        { status: 404 }
      )
    }

    const headers = Object.keys(csvData[0])
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row]
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        }).join(',')
      )
    ].join('\n')

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="subscriptions-export.csv"',
      },
    })

  } catch (error) {
    console.error('Export subscriptions error:', error)
    return NextResponse.json(
      { error: 'Failed to export subscriptions data' },
      { status: 500 }
    )
  }
}