import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { getUser, getUserProfile } from '@/lib/auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { SubscriptionStatus, AccountType } from '@prisma/client'

// File validation schema
const uploadSchema = z.object({
  type: z.enum(['product', 'catalogue', 'profile']),
  catalogueId: z.string().optional(),
  productId: z.string().optional(),
})

// Allowed file types and sizes
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'image/gif'
]

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_FILES = 5 // Maximum files per upload

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const supabaseAdmin = createServiceRoleClient()
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



    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const type = formData.get('type') as string
    const catalogueId = formData.get('catalogueId') as string | null
    const productId = formData.get('productId') as string | null

    // Validate request data
    const validatedData = uploadSchema.parse({
      type,
      catalogueId: catalogueId || undefined,
      productId: productId || undefined
    })

    // Validate files
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES} files allowed` },
        { status: 400 }
      )
    }

    // Validate each file
    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `File type ${file.type} not allowed. Allowed types: ${ALLOWED_TYPES.join(', ')}` },
          { status: 400 }
        )
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File ${file.name} is too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
          { status: 400 }
        )
      }
    }

    // Verify ownership if catalogueId or productId is provided
    if (validatedData.catalogueId) {
      const catalogue = await prisma.catalogue.findFirst({
        where: {
          id: validatedData.catalogueId,
          OR: [
            { profileId: profile.id }, // User owns the catalogue
            {
              teamMembers: {
                some: {
                  profileId: profile.id
                }
              }
            } // User is a team member
          ]
        }
      })

      if (!catalogue) {
        return NextResponse.json(
          { error: 'Catalogue not found or access denied' },
          { status: 403 }
        )
      }
    }

    if (validatedData.productId) {
      const product = await prisma.product.findFirst({
        where: {
          id: validatedData.productId,
          catalogue: {
            OR: [
              { profileId: profile.id }, // User owns the catalogue
              {
                teamMembers: {
                  some: {
                    profileId: profile.id
                  }
                }
              } // User is a team member
            ]
          }
        }
      })

      if (!product) {
        return NextResponse.json(
          { error: 'Product not found or access denied' },
          { status: 403 }
        )
      }
    }

    // Upload files to Supabase Storage
    const uploadResults = []
    const timestamp = Date.now()

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const fileExtension = file.name.split('.').pop()
      const fileName = `${validatedData.type}_${timestamp}_${i + 1}.${fileExtension}`
      
      // Create storage path based on type
      let storagePath: string
      switch (validatedData.type) {
        case 'product':
          storagePath = `products/${profile.id}/${validatedData.catalogueId}/${fileName}`
          break
        case 'catalogue':
          storagePath = `catalogues/${profile.id}/${fileName}`
          break
        case 'profile':
          storagePath = `profiles/${profile.id}/${fileName}`
          break
        default:
          storagePath = `misc/${profile.id}/${fileName}`
      }

      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer()
      const buffer = new Uint8Array(arrayBuffer)

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('catfy-uploads')
        .upload(storagePath, buffer, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        return NextResponse.json(
          { error: `Failed to upload ${file.name}: ${uploadError.message}` },
          { status: 500 }
        )
      }

      // Get public URL
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('catfy-uploads')
        .getPublicUrl(storagePath)

      uploadResults.push({
        fileName: file.name,
        originalName: file.name,
        size: file.size,
        type: file.type,
        url: publicUrl,
        path: storagePath
      })
    }

    return NextResponse.json({
      success: true,
      files: uploadResults,
      message: `Successfully uploaded ${uploadResults.length} file(s)`
    })

  } catch (error) {
    console.error('File upload error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE endpoint to remove uploaded files
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    const supabaseAdmin = createServiceRoleClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('path')

    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      )
    }

    // Get user profile
    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { id: true }
    })

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Verify the file belongs to the user (check if path contains user's profile ID)
    if (!filePath.includes(profile.id)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Delete from Supabase Storage
    const { error: deleteError } = await supabaseAdmin.storage
      .from('catfy-uploads')
      .remove([filePath])

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return NextResponse.json(
        { error: `Failed to delete file: ${deleteError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    })

  } catch (error) {
    console.error('File deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}