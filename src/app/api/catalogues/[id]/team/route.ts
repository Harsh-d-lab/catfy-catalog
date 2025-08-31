import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendTeamInvitation } from '@/lib/email'
import { canInviteTeamMembers, canAddTeamMember, getMaxTeamMembers, getTeamMemberUpgradeMessage } from '@/lib/subscription'
import { SubscriptionPlan } from '@prisma/client'
import crypto from 'crypto'
import type { User } from '@supabase/supabase-js'

// GET /api/catalogues/[id]/team - Get team members for a catalogue
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const catalogueId = params.id

    // Check if user owns the catalogue or is a team member
    const catalogue = await prisma.catalogue.findFirst({
      where: {
        id: catalogueId,
        OR: [
          { profileId: user.id },
          {
            teamMembers: {
              some: {
                profileId: user.id
              }
            }
          }
        ]
      },
      include: {
        profile: {
          select: {
            id: true,
            email: true,
            fullName: true,
            firstName: true,
            lastName: true,
            avatarUrl: true
          }
        },
        teamMembers: {
          include: {
            profile: {
              select: {
                id: true,
                email: true,
                fullName: true,
                firstName: true,
                lastName: true,
                avatarUrl: true
              }
            }
          },
          orderBy: {
            joinedAt: 'asc'
          }
        },
        invitations: {
          where: {
            status: 'PENDING',
            expiresAt: {
              gt: new Date()
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!catalogue) {
      return NextResponse.json(
        { error: 'Catalogue not found or access denied' },
        { status: 404 }
      )
    }

    // Format team data
    const owner = {
      id: catalogue.profile.id,
      email: catalogue.profile.email,
      fullName: catalogue.profile.fullName,
      firstName: catalogue.profile.firstName,
      lastName: catalogue.profile.lastName,
      avatarUrl: catalogue.profile.avatarUrl,
      role: 'OWNER' as const,
      joinedAt: catalogue.createdAt
    }

    const members = catalogue.teamMembers.map(member => ({
      id: member.profile.id,
      email: member.profile.email,
      fullName: member.profile.fullName,
      firstName: member.profile.firstName,
      lastName: member.profile.lastName,
      avatarUrl: member.profile.avatarUrl,
      role: member.role,
      joinedAt: member.joinedAt
    }))

    const team = [owner, ...members]
    const pendingInvitations = catalogue.invitations

    return NextResponse.json({
      team,
      pendingInvitations,
      isOwner: catalogue.profileId === user.id
    })
  } catch (error) {
    console.error('Error fetching team:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/catalogues/[id]/team - Invite a team member
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const catalogueId = params.id
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Check if user owns the catalogue
    const catalogue = await prisma.catalogue.findFirst({
      where: {
        id: catalogueId,
        profileId: user.id
      },
      include: {
        profile: {
          select: {
            fullName: true,
            firstName: true,
            lastName: true,
            email: true,
            subscriptions: {
              where: {
                status: 'ACTIVE'
              },
              orderBy: {
                createdAt: 'desc'
              },
              take: 1
            }
          }
        },
        teamMembers: true,
        invitations: {
          where: {
            status: 'PENDING',
            expiresAt: {
              gt: new Date()
            }
          }
        }
      }
    })

    if (!catalogue) {
      return NextResponse.json(
        { error: 'Catalogue not found or you are not the owner' },
        { status: 404 }
      )
    }

    // Check subscription plan and team collaboration feature
    const subscription = catalogue.profile.subscriptions[0]
    const plan = subscription?.plan || SubscriptionPlan.FREE

    if (!canInviteTeamMembers(plan)) {
      return NextResponse.json(
        { error: getTeamMemberUpgradeMessage(plan) },
        { status: 403 }
      )
    }

    // Check team member limits
    const currentTeamCount = catalogue.teamMembers.length
    if (!canAddTeamMember(plan, currentTeamCount)) {
      const maxMembers = getMaxTeamMembers(plan)
      return NextResponse.json(
        { error: `You have reached the maximum team member limit (${maxMembers}) for your ${plan} plan.` },
        { status: 403 }
      )
    }

    // Check if user is trying to invite themselves
    if (email.toLowerCase() === (user as User).email?.toLowerCase()) {
      return NextResponse.json(
        { error: 'You cannot invite yourself' },
        { status: 400 }
      )
    }

    // Check if user is already a team member
    const existingMember = await prisma.teamMember.findFirst({
      where: {
        catalogueId,
        profile: {
          email: {
            equals: email,
            mode: 'insensitive'
          }
        }
      }
    })

    if (existingMember) {
      return NextResponse.json(
        { error: 'This user is already a team member' },
        { status: 400 }
      )
    }

    // Check if there's already a pending invitation
    const existingInvitation = catalogue.invitations.find(
      inv => inv.email.toLowerCase() === email.toLowerCase()
    )

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'An invitation has already been sent to this email' },
        { status: 400 }
      )
    }

    // Generate invitation token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Create invitation
    const invitation = await prisma.invitation.create({
      data: {
        email: email.toLowerCase(),
        token,
        catalogueId,
        senderId: user.id,
        expiresAt,
        status: 'PENDING'
      }
    })

    // Send invitation email
    try {
      await sendTeamInvitation({
        inviterName: catalogue.profile.fullName || catalogue.profile.firstName || 'Team Owner',
        inviterEmail: catalogue.profile.email,
        catalogueName: catalogue.name,
        invitationToken: token,
        recipientEmail: email
      })
    } catch (emailError) {
      // If email fails, delete the invitation
      await prisma.invitation.delete({
        where: { id: invitation.id }
      })
      
      console.error('Failed to send invitation email:', emailError)
      return NextResponse.json(
        { error: 'Failed to send invitation email. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        status: invitation.status,
        createdAt: invitation.createdAt,
        expiresAt: invitation.expiresAt
      }
    })
  } catch (error) {
    console.error('Error inviting team member:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/catalogues/[id]/team - Remove a team member
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const catalogueId = params.id
    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('memberId')

    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      )
    }

    // Check if user owns the catalogue
    const catalogue = await prisma.catalogue.findFirst({
      where: {
        id: catalogueId,
        profileId: user.id
      }
    })

    if (!catalogue) {
      return NextResponse.json(
        { error: 'Catalogue not found or you are not the owner' },
        { status: 404 }
      )
    }

    // Remove team member
    const deletedMember = await prisma.teamMember.deleteMany({
      where: {
        catalogueId,
        profileId: memberId
      }
    })

    if (deletedMember.count === 0) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Team member removed successfully'
    })
  } catch (error) {
    console.error('Error removing team member:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}