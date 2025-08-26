import { NextRequest, NextResponse } from 'next/server'
import { getUser, getUserProfile } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateCatalogueSchema = z.object({
  name: z.string().min(1, 'Catalogue name is required').max(100).optional(),
  description: z.string().optional(),
  theme: z.string().optional(),
  isPublic: z.boolean().optional(),
  settings: z.object({
    showPrices: z.boolean().optional(),
    showCategories: z.boolean().optional(),
    showDescription: z.boolean().optional(),
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
    fontFamily: z.string().optional(),
    // Company Information
    companyInfo: z.object({
      companyName: z.string().optional(),
      companyDescription: z.string().optional(),
      industry: z.string().optional(),
      foundedYear: z.string().optional(),
      employeeCount: z.string().optional(),
      headquarters: z.string().optional(),
    }).optional(),
    // Media & Assets
    mediaAssets: z.object({
      logoUrl: z.string().optional(),
      coverImageUrl: z.string().optional(),
      brandColors: z.array(z.string()).optional(),
      brandFonts: z.array(z.string()).optional(),
    }).optional(),
    // Contact Details
    contactDetails: z.object({
      email: z.string().optional(),
      phone: z.string().optional(),
      website: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      postalCode: z.string().optional(),
    }).optional(),
    // Social Media
    socialMedia: z.object({
      facebook: z.string().optional(),
      twitter: z.string().optional(),
      instagram: z.string().optional(),
      linkedin: z.string().optional(),
      youtube: z.string().optional(),
      tiktok: z.string().optional(),
    }).optional(),
  }).optional(),
})

interface RouteParams {
  params: {
    id: string
  }
}

// GET - Retrieve specific catalogue
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const profile = await getUserProfile(user.id)
    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Continue with normal database query for all users

    const catalogue = await prisma.catalogue.findFirst({
      where: {
        id: params.id,
        profileId: profile.id,
      },
      include: {
        products: {
          include: {
            category: true,
          },
          orderBy: {
            sortOrder: 'asc',
          },
        },
        categories: {
          include: {
            _count: {
              select: {
                products: true,
              },
            },
          },
          orderBy: {
            sortOrder: 'asc',
          },
        },
        _count: {
          select: {
            products: true,
            categories: true,
          },
        },
      },
    })

    if (!catalogue) {
      return NextResponse.json(
        { error: 'Catalogue not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      catalogue: {
        id: catalogue.id,
        name: catalogue.name,
        description: catalogue.description,
        theme: catalogue.theme,
        isPublic: catalogue.isPublic,
        settings: {
          ...(catalogue.settings as Record<string, any> || {}),
          contactInfo: (catalogue.settings as any)?.contactInfo || {
            email: null,
            phone: null,
            website: null,
          },
        },
        products: catalogue.products.map(product => ({
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          images: product.images,
          isActive: product.isActive,
          sortOrder: product.sortOrder,
          category: product.category ? {
            id: product.category.id,
            name: product.category.name,
            color: product.category.color,
          } : null,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        })),
        categories: catalogue.categories.map(category => ({
          id: category.id,
          name: category.name,
          description: category.description,
          color: category.color,
          sortOrder: category.sortOrder,
          _count: {
            products: category._count.products,
          },
          createdAt: category.createdAt,
          updatedAt: category.updatedAt,
        })),
        profile: {
          fullName: profile.fullName,
          companyName: profile.companyName,
        },
        productCount: catalogue._count.products,
        categoryCount: catalogue._count.categories,
        createdAt: catalogue.createdAt,
        updatedAt: catalogue.updatedAt,
      },
    })
  } catch (error) {
    console.error('Catalogue retrieval error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve catalogue' },
      { status: 500 }
    )
  }
}

// PUT - Update catalogue
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const profile = await getUserProfile(user.id)
    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Continue with normal database operations for all users

    // Verify catalogue ownership
    const existingCatalogue = await prisma.catalogue.findFirst({
      where: {
        id: params.id,
        profileId: profile.id,
      },
    })

    if (!existingCatalogue) {
      return NextResponse.json(
        { error: 'Catalogue not found or access denied' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validatedData = updateCatalogueSchema.parse(body)

    // Merge settings if provided
    let updatedSettings = existingCatalogue.settings
    if (validatedData.settings) {
      updatedSettings = {
        ...(existingCatalogue.settings as any),
        ...validatedData.settings,
      }
    }

    const catalogue = await prisma.catalogue.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        settings: updatedSettings as any,
      },
      include: {
        _count: {
          select: {
            products: true,
            categories: true,
          },
        },
      },
    }) as any

    // Record analytics
    await prisma.analytics.create({
      data: {
        profileId: profile.id,
        catalogueId: catalogue.id,
        event: 'PAGE_VIEW',
        metadata: {
          action: 'catalogue_updated',
          updatedFields: Object.keys(validatedData),
        },
      },
    })

    return NextResponse.json({
      success: true,
      catalogue: {
        id: catalogue.id,
        name: catalogue.name,
        description: catalogue.description,
        theme: catalogue.theme,
        isPublic: catalogue.isPublic,
        settings: catalogue.settings,
        productCount: catalogue._count.products,
        categoryCount: catalogue._count.categories,
        createdAt: catalogue.createdAt,
        updatedAt: catalogue.updatedAt,
      },
    })
  } catch (error) {
    console.error('Catalogue update error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    const message = error instanceof Error ? error.message : 'Failed to update catalogue'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

// DELETE - Delete catalogue
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const profile = await getUserProfile(user.id)
    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Verify catalogue ownership
    const catalogue = await prisma.catalogue.findFirst({
      where: {
        id: params.id,
        profileId: profile.id,
      },
      include: {
        products: true,
        categories: true,
      },
    })

    if (!catalogue) {
      return NextResponse.json(
        { error: 'Catalogue not found or access denied' },
        { status: 404 }
      )
    }

    // Delete catalogue and related data (cascade)
    await prisma.$transaction(async (tx) => {
      // Delete products first (due to foreign key constraints)
      await tx.product.deleteMany({
        where: { catalogueId: params.id },
      })

      // Delete categories
      await tx.category.deleteMany({
        where: { catalogueId: params.id },
      })

      // Delete analytics
      await tx.analytics.deleteMany({
        where: { catalogueId: params.id },
      })

      // Delete exports
      await tx.export.deleteMany({
        where: { catalogueId: params.id },
      })

      // Finally delete the catalogue
      await tx.catalogue.delete({
        where: { id: params.id },
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Catalogue deleted successfully',
    })
  } catch (error) {
    console.error('Catalogue deletion error:', error)
    
    const message = error instanceof Error ? error.message : 'Failed to delete catalogue'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}