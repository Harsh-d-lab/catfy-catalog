'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Users, 
  UserPlus, 
  Mail, 
  MoreVertical, 
  Trash2, 
  Crown, 
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Copy,
  Send,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { UpgradePrompt } from '@/components/UpgradePrompt'
import { canInviteTeamMembers, getMaxTeamMembers, canAddTeamMember, getTeamMemberUpgradeMessage } from '@/lib/subscription'

interface TeamMember {
  id: string
  email: string
  fullName: string | null
  firstName: string | null
  lastName: string | null
  avatarUrl: string | null
  role: 'OWNER' | 'MEMBER'
  joinedAt: string
}

interface PendingInvitation {
  id: string
  email: string
  status: 'PENDING'
  createdAt: string
  expiresAt: string
  token?: string
}

interface TeamManagementProps {
  catalogueId: string
  isOwner: boolean
}

export function TeamManagement({ catalogueId, isOwner }: TeamManagementProps) {
  const [team, setTeam] = useState<TeamMember[]>([])
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isInviting, setIsInviting] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const [emailError, setEmailError] = useState('')
  const { currentPlan } = useSubscription()
  const maxTeamMembers = getMaxTeamMembers(currentPlan)
  const currentTeamCount = team.filter(member => member.role === 'MEMBER').length
  const canInvite = true // All plans now support team collaboration
  const canAddMore = canAddTeamMember(currentPlan, currentTeamCount)

  // Load team data
  const loadTeamData = async () => {
    try {
      const response = await fetch(`/api/catalogues/${catalogueId}/team`)
      if (!response.ok) {
        throw new Error('Failed to load team data')
      }
      const data = await response.json()
      setTeam(data.team || [])
      setPendingInvitations(data.pendingInvitations || [])
    } catch (error) {
      console.error('Error loading team data:', error)
      toast.error('Failed to load team data')
    } finally {
      setIsLoading(false)
    }
  }

  // Validate email
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Send invitation
  const sendInvitation = async () => {
    const email = inviteEmail.trim()
    
    if (!email) {
      setEmailError('Please enter an email address')
      return
    }

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address')
      return
    }

    // Check if email is already a team member
    const existingMember = team.find(member => member.email.toLowerCase() === email.toLowerCase())
    if (existingMember) {
      setEmailError('This email is already a team member')
      return
    }

    // Check if email already has a pending invitation
    const existingInvitation = pendingInvitations.find(inv => inv.email.toLowerCase() === email.toLowerCase())
    if (existingInvitation) {
      setEmailError('An invitation has already been sent to this email')
      return
    }

    if (!canAddMore) {
      setEmailError(`You have reached the maximum team member limit (${maxTeamMembers}) for your ${currentPlan} plan.`)
      return
    }

    setEmailError('')

    setIsInviting(true)
    try {
      const response = await fetch(`/api/catalogues/${catalogueId}/team`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation')
      }

      toast.success('Invitation sent successfully!')
      setInviteEmail('')
      setShowInviteDialog(false)
      loadTeamData() // Refresh data
    } catch (error: any) {
      console.error('Error sending invitation:', error)
      toast.error(error.message || 'Failed to send invitation')
    } finally {
      setIsInviting(false)
    }
  }

  // Remove team member
  const removeMember = async (memberId: string) => {
    try {
      const response = await fetch(`/api/catalogues/${catalogueId}/team?memberId=${memberId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to remove team member')
      }

      toast.success('Team member removed successfully')
      loadTeamData() // Refresh data
    } catch (error: any) {
      console.error('Error removing team member:', error)
      toast.error(error.message || 'Failed to remove team member')
    }
  }

  // Cancel invitation
  const cancelInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to cancel invitation')
      }

      toast.success('Invitation cancelled successfully')
      loadTeamData() // Refresh data
    } catch (error: any) {
      console.error('Error cancelling invitation:', error)
      toast.error(error.message || 'Failed to cancel invitation')
    }
  }

  // Resend invitation
  const resendInvitation = async (email: string) => {
    setIsInviting(true)
    try {
      const response = await fetch(`/api/catalogues/${catalogueId}/team`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend invitation')
      }

      toast.success('Invitation resent successfully!')
      loadTeamData() // Refresh data
    } catch (error: any) {
      console.error('Error resending invitation:', error)
      toast.error(error.message || 'Failed to resend invitation')
    } finally {
      setIsInviting(false)
    }
  }

  // Copy invitation link
  const copyInvitationLink = async (invitation: PendingInvitation) => {
    try {
      // Use the token from invitation data if available, otherwise fetch it
      let token = invitation.token
      if (!token) {
        const response = await fetch(`/api/invitations/${invitation.id}/token`)
        if (!response.ok) {
          throw new Error('Failed to get invitation token')
        }
        const data = await response.json()
        token = data.token
      }
      const invitationLink = `${window.location.origin}/invitations/accept?token=${token}`
      await navigator.clipboard.writeText(invitationLink)
      toast.success('Invitation link copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy invitation link')
    }
  }

  // Get member display name
  const getMemberDisplayName = (member: TeamMember) => {
    if (member.fullName) return member.fullName
    if (member.firstName && member.lastName) return `${member.firstName} ${member.lastName}`
    if (member.firstName) return member.firstName
    return member.email
  }

  // Get member initials
  const getMemberInitials = (member: TeamMember) => {
    if (member.firstName && member.lastName) {
      return `${member.firstName[0]}${member.lastName[0]}`.toUpperCase()
    }
    if (member.fullName) {
      const names = member.fullName.split(' ')
      return names.length > 1 
        ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
        : names[0][0].toUpperCase()
    }
    return member.email[0].toUpperCase()
  }

  useEffect(() => {
    loadTeamData()
  }, [catalogueId])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Management
          </CardTitle>
          <CardDescription>Loading team data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Management
              </CardTitle>
              <CardDescription>
                Collaborate with your team members on this catalogue
                {canInvite && (
                  <span className="block mt-1 text-sm">
                    {currentTeamCount} of {maxTeamMembers === -1 ? '∞' : maxTeamMembers} team members
                  </span>
                )}
              </CardDescription>
            </div>
            {isOwner && (
              <Button
                onClick={() => setShowInviteDialog(true)}
                className="flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Invite Member
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Team member limit notice */}
          {!canAddMore && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You have reached the maximum team member limit ({maxTeamMembers}) for your {currentPlan} plan.
              </AlertDescription>
            </Alert>
          )}

          {/* Team Members */}
          <div>
            <h3 className="text-lg font-medium mb-4">Team Members ({team.length})</h3>
            <div className="space-y-3">
              {team.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={member.avatarUrl || undefined} />
                      <AvatarFallback>{getMemberInitials(member)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{getMemberDisplayName(member)}</p>
                        {member.role === 'OWNER' && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Crown className="h-3 w-3" />
                            Owner
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{member.email}</p>
                      <p className="text-xs text-gray-500">
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {isOwner && member.role === 'MEMBER' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => removeMember(member.id)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove from team
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Pending Invitations */}
          {pendingInvitations.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-medium mb-4">Pending Invitations ({pendingInvitations.length})</h3>
                <div className="space-y-3">
                  {pendingInvitations.map((invitation) => (
                    <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                          <Mail className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                          <p className="font-medium">{invitation.email}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="h-3 w-3" />
                            <span>Invited {new Date(invitation.createdAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>Expires {new Date(invitation.expiresAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      {isOwner && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyInvitationLink(invitation)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy Link
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => resendInvitation(invitation.email)}
                                disabled={isInviting}
                              >
                                <Send className="h-4 w-4 mr-2" />
                                Resend Invitation
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => cancelInvitation(invitation.id)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Cancel Invitation
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation to collaborate on this catalogue. They will receive an email with instructions to join.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="inviteEmail">Email Address</Label>
              <Input
                id="inviteEmail"
                type="email"
                value={inviteEmail}
                onChange={(e) => {
                  setInviteEmail(e.target.value)
                  if (emailError) setEmailError('')
                }}
                placeholder="colleague@company.com"
                className={emailError ? 'border-red-500 focus:border-red-500' : ''}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    sendInvitation()
                  }
                }}
              />
              {emailError && (
                <p className="text-sm text-red-600 mt-1">{emailError}</p>
              )}
            </div>
            {!canAddMore && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You have reached the maximum team member limit ({maxTeamMembers}) for your {currentPlan} plan.
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={sendInvitation} 
              disabled={isInviting || !canAddMore || !inviteEmail.trim()}
              className="flex items-center gap-2"
            >
              {isInviting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upgrade Prompt */}
      <UpgradePrompt
        isOpen={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        feature="team collaboration"
        currentPlan={currentPlan as any}
      />
    </>
  )
}