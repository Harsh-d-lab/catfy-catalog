import { NextRequest, NextResponse } from 'next/server'
import { getUser, getUserProfile } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateProductSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  price: z.number().min(0).optional(),
  priceDisplay: z.string().optional(), // Changed from enum to string to match database schema
  sku: z.string().max(50).optional(),
  categoryId: z.string().uuid().optional().or(z.literal('')), // Allow empty string
  tags: z.array(z.string()).optional(),
  imageUrl: z.string().optional().or(z.literal('')), // Allow empty string, remove URL validation
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

    // Transform product to handle imageUrl fallback and convert Decimal to number
    const transformedProduct = {
      ...product,
      price: product.price ? Number(product.price) : null, // Convert Decimal to number
      imageUrl: product.imageUrl || (product.images && product.images.length > 0 ? product.images[0] : null)
    }

    return NextResponse.json({ product: transformedProduct })
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
    console.log('PUT request body received:', body)
    
    const validatedData = updateProductSchema.parse(body)
    console.log('Validated data:', validatedData)

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

    // Verify category exists if categoryId is provided and not empty
    if (validatedData.categoryId && validatedData.categoryId.trim() !== '') {
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
    
    // Convert empty categoryId to null for database
    if (validatedData.categoryId === '') {
      validatedData.categoryId = undefined
    }

    // Update product
    console.log('Updating product with ID:', params.productId)
    console.log('Update data being sent to database:', validatedData)
    
    const product = await prisma.product.update({
      where: {
        id: params.productId,
      },
      data: validatedData,
      include: {
        category: true,
      },
    })
    
    console.log('Product updated successfully:', product)

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