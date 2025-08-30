'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, Users, CheckCircle, XCircle, AlertTriangle, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface InvitationDetails {
  invitation: {
    id: string
    email: string
    createdAt: string
    expiresAt: string
  }
  catalogue: {
    id: string
    name: string
    description: string | null
  }
  sender: {
    id: string
    email: string
    fullName: string | null
    firstName: string | null
    lastName: string | null
    avatarUrl: string | null
  }
}

export default function AcceptInvitationPage() {
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAccepting, setIsAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  
  const router = useRouter()
  const params = useParams()
  const token = params.token as string
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    checkUser()
  }, [])

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link')
      setIsLoading(false)
      return
    }

    const fetchInvitation = async () => {
      try {
        const response = await fetch(`/api/invitations/verify?token=${token}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to verify invitation')
        }

        setInvitation(data)
      } catch (error) {
        console.error('Error fetching invitation:', error)
        setError(error instanceof Error ? error.message : 'Failed to load invitation')
      } finally {
        setIsLoading(false)
      }
    }

    fetchInvitation()
  }, [token])

  const handleAcceptInvitation = async () => {
    if (!invitation || !user) return

    setIsAccepting(true)
    try {
      const response = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept invitation')
      }

      toast.success('Invitation accepted successfully!')
      router.push(`/catalogue/${invitation.catalogue.id}/edit`)
    } catch (error) {
      console.error('Error accepting invitation:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to accept invitation')
    } finally {
      setIsAccepting(false)
    }
  }

  const handleSignIn = () => {
    // Store the invitation token to redirect back after sign in
    localStorage.setItem('pendingInvitation', token)
    router.push('/auth/login')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading invitation...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-red-900">Invalid Invitation</CardTitle>
            <CardDescription className="text-red-600">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go to Homepage
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!invitation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <CardTitle className="text-yellow-900">Invitation Not Found</CardTitle>
            <CardDescription className="text-yellow-600">
              This invitation may have expired or been revoked.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go to Homepage
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if invitation is expired
  const isExpired = new Date(invitation.invitation.expiresAt) < new Date()

  if (isExpired) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-red-900">Invitation Expired</CardTitle>
            <CardDescription className="text-red-600">
              This invitation expired on {new Date(invitation.invitation.expiresAt).toLocaleDateString()}.
              Please request a new invitation from the catalogue owner.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go to Homepage
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>Team Invitation</CardTitle>
            <CardDescription>
              You've been invited to collaborate on <strong>{invitation.catalogue.name}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Avatar className="h-10 w-10">
                <AvatarImage src={invitation.sender.avatarUrl || ''} />
                <AvatarFallback>
                  {invitation.sender.fullName?.charAt(0) || invitation.sender.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {invitation.sender.fullName || invitation.sender.email}
                </p>
                <p className="text-sm text-gray-500">{invitation.sender.email}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900">Catalogue Details</h3>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="font-medium text-blue-900">{invitation.catalogue.name}</p>
                {invitation.catalogue.description && (
                  <p className="text-sm text-blue-700 mt-1">{invitation.catalogue.description}</p>
                )}
              </div>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You need to sign in to accept this invitation.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Button onClick={handleSignIn} className="w-full">
                Sign In to Accept
              </Button>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go to Homepage
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Users className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle>Team Invitation</CardTitle>
          <CardDescription>
            You've been invited to collaborate on <strong>{invitation.catalogue.name}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <Avatar className="h-10 w-10">
              <AvatarImage src={invitation.sender.avatarUrl || ''} />
              <AvatarFallback>
                {invitation.sender.fullName?.charAt(0) || invitation.sender.email.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium text-gray-900">
                {invitation.sender.fullName || invitation.sender.email}
              </p>
              <p className="text-sm text-gray-500">{invitation.sender.email}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900">Catalogue Details</h3>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="font-medium text-blue-900">{invitation.catalogue.name}</p>
              {invitation.catalogue.description && (
                <p className="text-sm text-blue-700 mt-1">{invitation.catalogue.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Invited to: {invitation.invitation.email}</span>
            <Badge variant="outline">
              Expires {new Date(invitation.invitation.expiresAt).toLocaleDateString()}
            </Badge>
          </div>

          <div className="space-y-2">
            <Button 
              onClick={handleAcceptInvitation} 
              disabled={isAccepting}
              className="w-full"
            >
              {isAccepting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Accepting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accept Invitation
                </>
              )}
            </Button>
            <Link href="/">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go to Homepage
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}