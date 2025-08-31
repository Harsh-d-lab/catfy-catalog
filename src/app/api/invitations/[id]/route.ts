import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { InvitationStatus } from '@prisma/client'

// DELETE /api/invitations/[id] - Cancel a pending invitation
export async function DELETE(
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
        status: InvitationStatus.PENDING,
        catalogue: {
          profileId: user.id
        }
      },
      include: {
        catalogue: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found or you are not authorized to cancel it' },
        { status: 404 }
      )
    }

    // Update invitation status to cancelled
    await prisma.invitation.update({
      where: { id: invitationId },
      data: { 
        status: InvitationStatus.DECLINED
      }
    })

    return NextResponse.json({
      message: 'Invitation cancelled successfully'
    })
  } catch (error) {
    console.error('Error cancelling invitation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/invitations/[id] - Get invitation details (for invitation page)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Invitation token is required' },
        { status: 400 }
      )
    }

    // Find the invitation by token
    const invitation = await prisma.invitation.findFirst({
      where: {
        token,
        status: InvitationStatus.PENDING,
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        catalogue: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        sender: {
          select: {
            id: true,
            email: true,
            fullName: true,
            firstName: true,
            lastName: true,
            avatarUrl: true
          }
        }
      }
    })

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        createdAt: invitation.createdAt,
        expiresAt: invitation.expiresAt
      },
      catalogue: {
        id: invitation.catalogue.id,
        name: invitation.catalogue.name,
        description: invitation.catalogue.description
      },
      sender: {
        id: invitation.sender.id,
        email: invitation.sender.email,
        fullName: invitation.sender.fullName,
        firstName: invitation.sender.firstName,
        lastName: invitation.sender.lastName,
        avatarUrl: invitation.sender.avatarUrl
      }
    })
  } catch (error) {
    console.error('Error fetching invitation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}