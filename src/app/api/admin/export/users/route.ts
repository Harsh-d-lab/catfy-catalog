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

    // Fetch all users with related data
    const users = await prisma.profile.findMany({
      include: {
        subscriptions: {
          select: {
            plan: true,
            status: true,
            billingCycle: true,
            amount: true,
            currentPeriodEnd: true,
            createdAt: true
          }
        },
        catalogues: {
          select: {
            id: true
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

    // Transform data for CSV export
    const csvData = users.map(user => ({
      'User ID': user.id,
      'Email': user.email,
      'First Name': user.firstName || 'N/A',
      'Last Name': user.lastName || 'N/A',
      'Full Name': user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A',
      'Company Name': user.companyName || 'N/A',
      'Phone': user.phone || 'N/A',
      'Website': user.website || 'N/A',
      'Address': user.address || 'N/A',
      'City': user.city || 'N/A',
      'State': user.state || 'N/A',
      'Country': user.country || 'N/A',
      'Postal Code': user.postalCode || 'N/A',
      'Account Type': user.accountType || 'INDIVIDUAL',
      'Subscription Plan': user.subscriptions?.[0]?.plan || 'FREE',
      'Subscription Status': user.subscriptions?.[0]?.status || 'N/A',
      'Billing Cycle': user.subscriptions?.[0]?.billingCycle || 'N/A',
      'Subscription Amount': user.subscriptions?.[0]?.amount ? Number(user.subscriptions[0].amount) : 0,
      'Subscription End Date': user.subscriptions?.[0]?.currentPeriodEnd?.toISOString() || 'N/A',
      'Subscription Created': user.subscriptions?.[0]?.createdAt?.toISOString() || 'N/A',
      'Catalogue Count': user._count.catalogues,
      'Stripe Customer ID': user.stripeCustomerId || 'N/A',
      'Created At': user.createdAt.toISOString(),
      'Updated At': user.updatedAt.toISOString()
    }))

    // Convert to CSV format
    if (csvData.length === 0) {
      return NextResponse.json(
        { error: 'No user data found' },
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
        'Content-Disposition': `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })

  } catch (error) {
    console.error('Admin users export error:', error)
    return NextResponse.json(
      { error: 'Failed to export users data' },
      { status: 500 }
    )
  }
}