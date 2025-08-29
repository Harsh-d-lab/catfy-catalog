import { NextRequest, NextResponse } from 'next/server'
import { getUser, getUserProfile } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(100),
  description: z.string().optional(),
  price: z.number().min(0).optional(),
  priceDisplay: z.enum(['show', 'hide', 'contact']).default('show'),
  sku: z.string().optional(),
  categoryId: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  imageUrl: z.string().optional(),
  isActive: z.boolean().default(true),
})

const updateProductSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  price: z.number().min(0).optional(),
  priceDisplay: z.enum(['show', 'hide', 'contact']).optional(),
  sku: z.string().optional(),
  categoryId: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  imageUrl: z.string().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
})

interface RouteParams {
  params: {
    id: string
  }
}

// GET - Get all products for a catalogue
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

    // Verify catalogue ownership
    const catalogue = await prisma.catalogue.findFirst({
      where: {
        id: params.id,
        profileId: profile.id,
      },
    })

    if (!catalogue) {
      return NextResponse.json(
        { error: 'Catalogue not found' },
        { status: 404 }
      )
    }

    // Get products
    const products = await prisma.product.findMany({
      where: {
        catalogueId: params.id,
      },
      include: {
        category: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    })

    // Transform products to handle imageUrl fallback
    const transformedProducts = products.map(product => ({
      ...product,
      imageUrl: product.imageUrl || (product.images && product.images.length > 0 ? product.images[0] : null)
    }))

    return NextResponse.json({ products: transformedProducts })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new product
export async function POST(
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
    })

    if (!catalogue) {
      return NextResponse.json(
        { error: 'Catalogue not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validatedData = createProductSchema.parse(body)

    // Get the next sort order
    const lastProduct = await prisma.product.findFirst({
      where: { catalogueId: params.id },
      orderBy: { sortOrder: 'desc' },
    })

    const sortOrder = (lastProduct?.sortOrder || 0) + 1

    // Create product
    const product = await prisma.product.create({
      data: {
        ...validatedData,
        catalogueId: params.id,
        sortOrder,
      },
      include: {
        category: true,
      },
    })

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}