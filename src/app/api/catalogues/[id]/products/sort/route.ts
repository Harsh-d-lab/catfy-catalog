import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getUserProfile } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await getUserProfile(user.id)
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const catalogueId = params.id
    const { productUpdates } = await request.json()

    // Validate that the catalogue belongs to the user
    const catalogue = await prisma.catalogue.findFirst({
      where: {
        id: catalogueId,
        profileId: profile.id
      }
    })

    if (!catalogue) {
      return NextResponse.json({ error: 'Catalogue not found' }, { status: 404 })
    }

    // Validate productUpdates format
    if (!Array.isArray(productUpdates)) {
      return NextResponse.json({ error: 'Invalid product updates format' }, { status: 400 })
    }

    // Update product sort orders in a transaction
    await prisma.$transaction(async (tx) => {
      for (const update of productUpdates) {
        if (!update.id || typeof update.sortOrder !== 'number') {
          throw new Error('Invalid product update format')
        }

        await tx.product.update({
          where: {
            id: update.id,
            catalogueId: catalogueId
          },
          data: {
            sortOrder: update.sortOrder
          }
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating product sort orders:', error)
    return NextResponse.json(
      { error: 'Failed to update product sort orders' },
      { status: 500 }
    )
  }
}