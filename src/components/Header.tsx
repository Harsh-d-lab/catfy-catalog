'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { signOut, isClientAdmin } from '@/lib/client-auth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  User, 
  Settings, 
  CreditCard, 
  LogOut, 
  Crown,
  HelpCircle,
  FileText
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface HeaderProps {
  title?: string
  showBackButton?: boolean
  backHref?: string
}

interface UserProfile {
  id: string
  email: string
  fullName: string | null
  avatarUrl: string | null
  subscriptionPlan: string
}

export function Header({ title, showBackButton = false, backHref = '/dashboard' }: HeaderProps) {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        
        if (user) {
          // Check if user is admin
          const adminStatus = await isClientAdmin()
          setIsAdmin(adminStatus)
          
          // Fetch user profile
          const response = await fetch('/api/auth/profile')
          if (response.ok) {
            const data = await response.json()
            setProfile(data.profile)
          }
        }
      } catch (error) {
        console.error('Error fetching user:', error)
      } finally {
        setIsLoading(false)
      }
    }

    getUser()
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Signed out successfully')
      
      // Redirect based on user type
      if (isAdmin) {
        window.location.href = '/admin/login'
      } else {
        window.location.href = '/auth/login'
      }
    } catch (error) {
      console.error('Error signing out:', error)
      toast.error('Error signing out')
    }
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  const getPlanBadgeColor = (plan: string) => {
    switch (plan?.toLowerCase()) {
      case 'monthly':
      case 'yearly':
        return 'text-yellow-600'
      default:
        return 'text-gray-600'
    }
  }

  if (isLoading) {
    return (
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {showBackButton && (
                <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
              )}
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
          </div>
        </div>
      </header>
    )
  }

  if (!user) {
    return null
  }

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <Button variant="ghost" size="sm" asChild>
                <Link href={isAdmin ? '/admin' : backHref}>
                  ←
                </Link>
              </Button>
            )}
            {title && (
              <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatarUrl || ''} alt={profile?.fullName || user.email} />
                    <AvatarFallback className="text-xs">
                      {getInitials(profile?.fullName || null, user.email)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium leading-none">
                    {profile?.fullName || 'User'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                  {profile?.subscriptionPlan && (
                    <div className="flex items-center space-x-1 mt-1">
                      <Crown className={`h-3 w-3 ${getPlanBadgeColor(profile.subscriptionPlan)}`} />
                      <span className={`text-xs font-medium ${getPlanBadgeColor(profile.subscriptionPlan)}`}>
                        {profile.subscriptionPlan.charAt(0).toUpperCase() + profile.subscriptionPlan.slice(1)} Plan
                      </span>
                    </div>
                  )}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={isAdmin ? '/admin' : '/dashboard'} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/billing" className="cursor-pointer">
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Manage Billing</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/help" className="cursor-pointer">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    <span>Help & Support</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/documentation" className="cursor-pointer">
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Documentation</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}