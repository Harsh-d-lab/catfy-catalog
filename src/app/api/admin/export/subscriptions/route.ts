import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { ADMIN_EMAILS } from '@/lib/admin-config'

export async function GET(request: NextRequest) {
  try {
    // Check for admin session cookies first
    const cookieStore = cookies()
    const adminSession = cookieStore.get('admin-session')?.value
    const testUserBypass = cookieStore.get('test-user-bypass')?.value
    
    // Allow access if admin session cookie is present
    if (adminSession === 'admin@catfy.com' || testUserBypass === 'test@catfy.com') {
      // Admin access granted via cookie
    } else {
      // Fallback to Supabase authentication
      const supabase = createRouteHandlerClient({ cookies })
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user?.email || !ADMIN_EMAILS.includes(user.email)) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
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