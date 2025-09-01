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

    // Fetch all catalogues with related data
    const catalogues = await prisma.catalogue.findMany({
      include: {
        profile: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            companyName: true
          }
        },
        _count: {
          select: {
            products: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform data for CSV export
    const csvData = catalogues.map(catalogue => ({
      'Catalogue ID': catalogue.id,
      'Name': catalogue.name,
      'Description': catalogue.description || 'N/A',
      'Owner Name': `${catalogue.profile.firstName || ''} ${catalogue.profile.lastName || ''}`.trim() || 'N/A',
      'Owner Email': catalogue.profile.email,
      'Owner Company': catalogue.profile.companyName || 'N/A',
      'Is Public': catalogue.isPublic ? 'Yes' : 'No',
      'Product Count': catalogue._count.products,
      'View Count': catalogue.viewCount,
      'Export Count': catalogue.exportCount,
      'Theme': catalogue.theme || 'default',
      'Custom Domain': catalogue.customDomain || 'N/A',
      'SEO Title': catalogue.seoTitle || 'N/A',
      'SEO Description': catalogue.seoDescription || 'N/A',
      'Created At': catalogue.createdAt.toISOString(),
      'Updated At': catalogue.updatedAt.toISOString()
    }))

    // Convert to CSV format
    if (csvData.length === 0) {
      return NextResponse.json(
        { error: 'No catalogue data found' },
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
        'Content-Disposition': `attachment; filename="catalogues-export-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })

  } catch (error) {
    console.error('Admin catalogues export error:', error)
    return NextResponse.json(
      { error: 'Failed to export catalogues data' },
      { status: 500 }
    )
  }
}