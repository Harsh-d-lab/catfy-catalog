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

    // Fetch all catalogues with their related data
    const catalogues = await prisma.catalogue.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        theme: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
        profile: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        _count: {
          select: {
            products: true,
            categories: true,
            analytics: true
          }
        },
        products: {
          select: {
            id: true,
            name: true,
            price: true,
            createdAt: true
          },
          take: 5, // Show only first 5 products
          orderBy: {
            createdAt: 'desc'
          }
        },
        categories: {
          select: {
            id: true,
            name: true,
            color: true
          },
          take: 3, // Show only first 3 categories
          orderBy: {
            sortOrder: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform the data for admin dashboard
    const transformedCatalogues = catalogues.map(catalogue => ({
      id: catalogue.id,
      name: catalogue.name,
      description: catalogue.description,
      isPublic: catalogue.isPublic,
      productCount: catalogue._count.products,
      viewCount: catalogue._count.analytics, // Using analytics count as view count
      exportCount: 0, // Not directly available, would need separate query
      createdAt: catalogue.createdAt.toISOString(),
      updatedAt: catalogue.updatedAt.toISOString(),
      user: {
        fullName: `${catalogue.profile.firstName || ''} ${catalogue.profile.lastName || ''}`.trim() || 'N/A',
        email: catalogue.profile.email
      }
    }))

    return NextResponse.json({
      catalogues: transformedCatalogues,
      total: transformedCatalogues.length
    })

  } catch (error) {
    console.error('Admin catalogues fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch catalogues data' },
      { status: 500 }
    )
  }
}