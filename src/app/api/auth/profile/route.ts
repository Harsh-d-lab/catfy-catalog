import { NextRequest, NextResponse } from 'next/server'
import { getUser, getUserProfile, createOrUpdateProfile } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateProfileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').optional(),
  accountType: z.enum(['INDIVIDUAL', 'BUSINESS']).optional(),
  companyName: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  timezone: z.string().optional(),
})

// GET - Retrieve user profile
export async function GET() {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    let profile = await getUserProfile(user.id)
    
    // If profile doesn't exist, try to create it
    if (!profile && user.email) {
      try {
        await createOrUpdateProfile({
          email: user.email,
          firstName: user.user_metadata?.full_name?.split(' ')[0] || '',
          lastName: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
          accountType: 'INDIVIDUAL',
        })
        // Fetch the profile with includes after creation
        profile = await getUserProfile(user.id)
      } catch (error) {
        console.error('Failed to create profile:', error)
        // If creation fails, try to fetch again in case another request created it
        profile = await getUserProfile(user.id)
      }
    }
    
    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found and could not be created' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      profile: {
        id: profile.id,
        fullName: profile.fullName,
        accountType: profile.accountType,
        companyName: profile.companyName,
        phone: profile.phone,
        website: profile.website,
        address: profile.address,
        city: profile.city,
        state: profile.state,
        country: profile.country,
        postalCode: profile.postalCode,
        timezone: profile.timezone,
        avatarUrl: profile.avatarUrl,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      },
      user: {
        id: user.id,
        email: user.email,
        emailConfirmedAt: user.email_confirmed_at,
        lastSignInAt: user.last_sign_in_at,
      },
    })
  } catch (error) {
    console.error('Profile retrieval error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve profile' },
      { status: 500 }
    )
  }
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = updateProfileSchema.parse(body)

    // Clean up empty strings
    const updateData = Object.fromEntries(
      Object.entries(validatedData).filter(([_, value]) => value !== '')
    )

    const updatedProfile = await prisma.profile.update({
      where: { id: user.id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      profile: {
        id: updatedProfile.id,
        fullName: updatedProfile.fullName,
        accountType: updatedProfile.accountType,
        companyName: updatedProfile.companyName,
        phone: updatedProfile.phone,
        website: updatedProfile.website,
        address: updatedProfile.address,
        city: updatedProfile.city,
        state: updatedProfile.state,
        country: updatedProfile.country,
        postalCode: updatedProfile.postalCode,
        timezone: updatedProfile.timezone,
        avatarUrl: updatedProfile.avatarUrl,
        updatedAt: updatedProfile.updatedAt,
      },
    })
  } catch (error) {
    console.error('Profile update error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    const message = error instanceof Error ? error.message : 'Failed to update profile'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

// POST - Create or sync profile (used after Supabase auth)
export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { accountType = 'INDIVIDUAL', fullName } = body

    const profile = await createOrUpdateProfile({
      email: user.email!,
      firstName: fullName?.split(' ')[0] || user.user_metadata?.full_name?.split(' ')[0] || '',
      lastName: fullName?.split(' ').slice(1).join(' ') || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
      accountType,
    })

    return NextResponse.json({
      success: true,
      profile: {
        id: profile.id,
        fullName: profile.fullName,
        accountType: profile.accountType,
        companyName: profile.companyName,
        phone: profile.phone,
        website: profile.website,
        address: profile.address,
        city: profile.city,
        state: profile.state,
        country: profile.country,
        postalCode: profile.postalCode,
        avatarUrl: profile.avatarUrl,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      },
    })
  } catch (error) {
    console.error('Profile creation error:', error)
    
    const message = error instanceof Error ? error.message : 'Failed to create profile'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}