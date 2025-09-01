import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendInvitationAcceptedNotification } from '@/lib/email'
import { canAddTeamMember, getMaxTeamMembers } from '@/lib/subscription'
import { SubscriptionPlan } from '@prisma/client'
import type { User } from '@supabase/supabase-js'

// POST /api/invitations/accept - Accept a team invitation
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const { token } = await request.json()

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Invitation token is required' },
        { status: 400 }
      )
    }

    // Find the invitation
    const invitation = await prisma.invitation.findFirst({
      where: {
        token,
        status: 'PENDING',
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        catalogue: {
          include: {
            profile: {
              select: {
                id: true,
                email: true,
                fullName: true,
                firstName: true,
                lastName: true,
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
            teamMembers: true
          }
        },
        sender: {
          select: {
            id: true,
            email: true,
            fullName: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation token' },
        { status: 404 }
      )
    }

    // Check if the invitation email matches the current user's email
    if (invitation.email.toLowerCase() !== (user as User).email?.toLowerCase()) {
      return NextResponse.json(
        { error: 'This invitation was sent to a different email address' },
        { status: 403 }
      )
    }

    // Check if user is already a team member
    const existingMember = await prisma.teamMember.findFirst({
      where: {
        catalogueId: invitation.catalogueId,
        profileId: user.id
      }
    })

    if (existingMember) {
      // Mark invitation as accepted even if already a member
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' }
      })

      return NextResponse.json(
        { error: 'You are already a member of this team' },
        { status: 400 }
      )
    }

    // Check if user is the catalogue owner
    if (invitation.catalogue.profileId === user.id) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED' }
      })

      return NextResponse.json(
        { error: 'You cannot join your own catalogue as a team member' },
        { status: 400 }
      )
    }

    // Check subscription plan and team limits
    const subscription = invitation.catalogue.profile.subscriptions[0]
    const plan = subscription?.plan || SubscriptionPlan.FREE
    const currentTeamCount = invitation.catalogue.teamMembers.length

    if (!canAddTeamMember(plan, currentTeamCount)) {
      const maxMembers = getMaxTeamMembers(plan)
      return NextResponse.json(
        { error: `This catalogue has reached the maximum team member limit (${maxMembers}) for the ${plan} plan.` },
        { status: 403 }
      )
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Create team member
      const teamMember = await tx.teamMember.create({
        data: {
          catalogueId: invitation.catalogueId,
          profileId: user.id,
          role: 'MEMBER',
          joinedAt: new Date()
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
          catalogue: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })

      // Update invitation status
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { 
          status: 'ACCEPTED',
          acceptedAt: new Date()
        }
      })

      return teamMember
    })

    // Send notification to catalogue owner
    try {
      await sendInvitationAcceptedNotification({
        ownerName: invitation.catalogue.profile.fullName || invitation.catalogue.profile.firstName || 'Catalogue Owner',
        ownerEmail: invitation.catalogue.profile.email,
        memberName: (user as User).email || 'Team Member',
        memberEmail: (user as User).email || '',
        catalogueName: invitation.catalogue.name
      })
    } catch (emailError) {
      // Log error but don't fail the request
      console.error('Failed to send acceptance notification:', emailError)
    }

    return NextResponse.json({
      message: 'Invitation accepted successfully',
      teamMember: {
        id: result.profile.id,
        email: result.profile.email,
        fullName: result.profile.fullName,
        firstName: result.profile.firstName,
        lastName: result.profile.lastName,
        avatarUrl: result.profile.avatarUrl,
        role: result.role,
        joinedAt: result.joinedAt
      },
      catalogue: {
        id: result.catalogue.id,
        name: result.catalogue.name
      }
    })
  } catch (error) {
    console.error('Error accepting invitation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}