import { NextRequest, NextResponse } from 'next/server'
import { getUser, getUserProfile } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateProductSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  price: z.number().min(0).optional(),
  priceDisplay: z.enum(['show', 'hide', 'contact']).optional(),
  sku: z.string().max(50).optional(),
  categoryId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  images: z.array(z.string().url()).optional(),
  specifications: z.record(z.string()).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
})

interface RouteParams {
  params: {
    id: string
    productId: string
  }
}

// GET - Get a specific product
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

    // Get product
    const product = await prisma.product.findFirst({
      where: {
        id: params.productId,
        catalogueId: params.id,
      },
      include: {
        category: true,
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update a product
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

    // Verify product exists and belongs to catalogue
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: params.productId,
        catalogueId: params.id,
      },
    })

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validatedData = updateProductSchema.parse(body)

    // Check if SKU conflicts with existing products (if SKU is being updated)
    if (validatedData.sku && validatedData.sku !== existingProduct.sku) {
      const skuConflict = await prisma.product.findFirst({
        where: {
          catalogueId: params.id,
          sku: validatedData.sku,
          id: { not: params.productId },
        },
      })

      if (skuConflict) {
        return NextResponse.json(
          { error: 'SKU already exists in this catalogue' },
          { status: 400 }
        )
      }
    }

    // Verify category exists if categoryId is provided
    if (validatedData.categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: validatedData.categoryId,
          catalogueId: params.id,
        },
      })

      if (!category) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 400 }
        )
      }
    }

    // Update product
    const product = await prisma.product.update({
      where: {
        id: params.productId,
      },
      data: validatedData,
      include: {
        category: true,
      },
    })

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Error updating product:', error)
    
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

// DELETE - Delete a product
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
    })

    if (!catalogue) {
      return NextResponse.json(
        { error: 'Catalogue not found' },
        { status: 404 }
      )
    }

    // Verify product exists and belongs to catalogue
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: params.productId,
        catalogueId: params.id,
      },
    })

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Delete product
    await prisma.product.delete({
      where: {
        id: params.productId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}