import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/invitations/[id]/token - Get invitation token for sharing
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const invitationId = params.id

    // Find the invitation and verify ownership
    const invitation = await prisma.invitation.findFirst({
      where: {
        id: invitationId,
        status: 'PENDING',
        catalogue: {
          profileId: user.id
        }
      },
      select: {
        id: true,
        token: true,
        email: true,
        expiresAt: true
      }
    })

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found or you are not authorized to access it' },
        { status: 404 }
      )
    }

    // Check if invitation is still valid
    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      token: invitation.token,
      email: invitation.email,
      expiresAt: invitation.expiresAt
    })
  } catch (error) {
    console.error('Error getting invitation token:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}