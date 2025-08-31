import { createClient } from '@/lib/supabase/server'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { AccountType } from '@prisma/client'
import { ADMIN_EMAILS } from '@/lib/admin-config'
import type { User } from '@supabase/supabase-js'

export async function getUser() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  return user
}

export async function requireAuth() {
  const user = await getUser()
  
  if (!user) {
    redirect('/auth')
  }
  
  return user
}

export async function getUserProfile(userId?: string) {
  const user = userId ? { id: userId } : await getUser()
  
  if (!user) {
    return null
  }
  
  // Handle admin profile - create in database if it doesn't exist
  if (user.id === 'admin-profile-id' || (user as User).email === 'admin@catfy.com') {
    let adminProfile = await prisma.profile.findUnique({
      where: { id: 'admin-profile-id' },
      include: {
        catalogues: {
          orderBy: { updatedAt: 'desc' },
          take: 5,
        },
        subscriptions: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })
    
    if (!adminProfile) {
      adminProfile = await prisma.profile.create({
        data: {
          id: 'admin-profile-id',
          email: 'admin@catfy.com',
          firstName: 'Admin',
          lastName: 'User',
          fullName: 'Admin User',
          accountType: 'BUSINESS',
          companyName: 'CATFY Administration',
          phone: '+1-555-ADMIN',
          website: 'https://catfy.com',
        },
        include: {
          catalogues: {
            orderBy: { updatedAt: 'desc' },
            take: 5,
          },
          subscriptions: {
            where: { status: 'ACTIVE' },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      })
    }
    
    return adminProfile
  }
  
  // Removed hardcoded test user profile logic
  
  // Try to find existing profile
  let profile = await prisma.profile.findUnique({
    where: { id: user.id },
    include: {
      catalogues: {
        orderBy: { updatedAt: 'desc' },
        take: 5,
      },
      subscriptions: {
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })
  
  // Profile creation is now handled in the API route to prevent race conditions
  
  return profile
}

export async function createOrUpdateProfile({
  email,
  firstName,
  lastName,
  accountType,
  companyName,
}: {
  email: string
  firstName?: string
  lastName?: string
  accountType: AccountType
  companyName?: string
}) {
  const user = await getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }
  
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || null
  
  const profile = await prisma.profile.upsert({
    where: { id: user.id },
    update: {
      email,
      firstName,
      lastName,
      fullName,
      accountType,
      companyName,
    },
    create: {
      id: user.id,
      email,
      firstName,
      lastName,
      fullName,
      accountType,
      companyName,
    },
  })
  
  return profile
}

export async function signOut() {
  const supabase = createBrowserClient()
  await supabase.auth.signOut()
}

export async function isAdmin(userId?: string) {
  const user = userId ? { id: userId } : await getUser()
  
  if (!user) {
    return false
  }
  
  // Check if user is admin using the admin configuration
  const userEmail = (user as User).email || ''
  return ADMIN_EMAILS.includes(userEmail) || userEmail.includes('admin') || false
}

export async function requireAdmin() {
  const user = await requireAuth()
  const admin = await isAdmin(user.id)
  
  if (!admin) {
    redirect('/dashboard')
  }
  
  return user
}