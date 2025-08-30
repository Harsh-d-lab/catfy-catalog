import { NextRequest, NextResponse } from 'next/server'
import { getUser, getUserProfile } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadFile, getSignedUrl } from '@/lib/storage'
import { z } from 'zod'
import { chromium } from 'playwright'

const exportPdfSchema = z.object({
  catalogueId: z.string().refine(
    (id) => {
      // Allow valid UUIDs or test catalogue IDs
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      const testIdRegex = /^test-catalogue(-\d+)?(-id)?$/
      return uuidRegex.test(id) || testIdRegex.test(id)
    },
    {
      message: 'Invalid catalogue ID format',
    }
  ),
  theme: z.string().optional().default('modern'),
  format: z.enum(['A4', 'Letter']).optional().default('A4'),
  orientation: z.enum(['portrait', 'landscape']).optional().default('portrait'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { catalogueId, theme, format, orientation } = exportPdfSchema.parse(body)

    // First, try to get authenticated user for owned catalogues
    const user = await getUser()
    let profile = null
    let catalogue = null

    if (user) {
      profile = await getUserProfile(user.id)
      
      // Check for owned or team member catalogue first
      catalogue = await prisma.catalogue.findFirst({
        where: {
          id: catalogueId,
          OR: [
            { profileId: profile?.id }, // User owns the catalogue
            {
              teamMembers: {
                some: {
                  profileId: profile?.id
                }
              }
            } // User is a team member
          ]
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
            orderBy: {
              sortOrder: 'asc',
            },
          },
          profile: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              companyName: true,
              email: true,
            },
          },
        },
      }) as any
    }

    // If not found as owned catalogue, check for public catalogue
    if (!catalogue) {
      catalogue = await prisma.catalogue.findFirst({
        where: {
          id: catalogueId,
          isPublic: true, // Only allow public catalogues for non-authenticated users
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
            orderBy: {
              sortOrder: 'asc',
            },
          },
          profile: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              companyName: true,
              email: true,
            },
          },
        },
      }) as any
    }

    if (!catalogue) {
      return NextResponse.json(
        { error: 'Catalogue not found or access denied' },
        { status: 404 }
      )
    }

    // For authenticated users with owned catalogues, check subscription
    if (user && profile && catalogue.profileId === profile.id) {
      // Skip subscription check in development environment
      const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_APP_URL?.includes('localhost')
      
      if (!isDevelopment) {
        const activeSubscription = await prisma.subscription.findFirst({
          where: {
            profileId: profile.id,
            status: {
              in: ['ACTIVE', 'TRIALING'],
            },
          },
        })

        if (!activeSubscription) {
          return NextResponse.json(
            { error: 'Active subscription required for PDF export' },
            { status: 403 }
          )
        }
      }
    }
    // For public catalogues, no subscription check needed

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const previewUrl = `${baseUrl}/preview/${catalogueId}?theme=${theme}&format=${format}&orientation=${orientation}`

    // Launch browser and generate PDF
    const browser = await chromium.launch({
      headless: process.env.PLAYWRIGHT_HEADLESS !== 'false',
    })

    try {
      const page = await browser.newPage()
      
      // Set viewport for consistent rendering
      await page.setViewportSize({ width: 1200, height: 800 })
      
      // Navigate to preview page
      await page.goto(previewUrl, {
        waitUntil: 'networkidle',
        timeout: 30000,
      })

      // Wait for content to load
      await page.waitForSelector('[data-pdf-ready="true"]', {
        timeout: 10000,
      }).catch(() => {
        // Fallback: wait for a reasonable time
        return page.waitForTimeout(3000)
      })

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: format === 'Letter' ? 'letter' : 'a4',
        landscape: orientation === 'landscape',
        printBackground: true,
        margin: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in',
        },
        preferCSSPageSize: true,
      })

      await browser.close()

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = `catalogue-${catalogue.name.replace(/[^a-zA-Z0-9]/g, '-')}-${timestamp}.pdf`

      // For authenticated users with owned catalogues, store the PDF
      if (user && profile && catalogue.profileId === profile.id) {
        const filePath = `exports/${profile.id}/${filename}`

        // Upload to Supabase storage
        const uploadResult = await uploadFile(
          new File([new Uint8Array(pdfBuffer)], filename, { type: 'application/pdf' }),
          'exports',
          profile.id,
          true, // Allow PDF uploads
          true  // Use service role to bypass RLS
        )

        if (uploadResult.error) {
          throw new Error('Failed to upload PDF to storage')
        }

        // Generate signed URL for secure access
        const signedUrlResult = await getSignedUrl(uploadResult.path, 3600) // 1 hour expiry
        const downloadUrl = signedUrlResult.url || uploadResult.url

        // Record export in database
        const exportRecord = await prisma.export.create({
          data: {
            profileId: profile.id,
            catalogueId: catalogue.id,
            type: 'PDF',
            status: 'COMPLETED',
            fileUrl: downloadUrl,
            filePath: uploadResult.path,
            fileName: filename,
            fileSize: pdfBuffer.length,
            metadata: {
              theme,
              format,
              orientation,
              productCount: catalogue.products?.length || 0,
              categoryCount: catalogue.categories?.length || 0,
            },
          },
        })

        // Record analytics
        await prisma.analytics.create({
          data: {
            profileId: profile.id,
            catalogueId: catalogue.id,
            event: 'PDF_EXPORT',
            metadata: {
              theme,
              format,
              orientation,
              fileSize: pdfBuffer.length,
            },
          },
        })

        return NextResponse.json({
          success: true,
          export: {
            id: exportRecord.id,
            fileName: filename,
            fileSize: pdfBuffer.length,
            downloadUrl: uploadResult.url,
          },
        })
      } else {
        // For public catalogues, return PDF directly as download
        const headers = new Headers()
        headers.set('Content-Type', 'application/pdf')
        headers.set('Content-Disposition', `attachment; filename="${filename}"`)
        headers.set('Content-Length', pdfBuffer.length.toString())

        return new NextResponse(pdfBuffer as BodyInit, {
          status: 200,
          headers,
        })
      }
    } catch (error) {
      await browser.close()
      throw error
    }
  } catch (error) {
    console.error('PDF export error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return NextResponse.json(
          { error: 'PDF generation timed out. Please try again.' },
          { status: 408 }
        )
      }
      
      if (error.message.includes('navigation')) {
        return NextResponse.json(
          { error: 'Failed to load preview page for PDF generation.' },
          { status: 500 }
        )
      }
    }

    const message = error instanceof Error ? error.message : 'Failed to export PDF'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve export history
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const catalogueId = searchParams.get('catalogueId')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {
      profileId: profile.id,
      type: 'PDF',
    }

    if (catalogueId) {
      where.catalogueId = catalogueId
    }

    const exports = await prisma.export.findMany({
      where,
      include: {
        catalogue: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    })

    const total = await prisma.export.count({ where })

    return NextResponse.json({
      exports: exports.map(exp => ({
        id: exp.id,
        fileName: exp.fileName,
        fileSize: exp.fileSize,
        status: exp.status,
        createdAt: exp.createdAt,
        catalogue: exp.catalogue,
        metadata: exp.metadata,
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    console.error('Export history error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve export history' },
      { status: 500 }
    )
  }
}