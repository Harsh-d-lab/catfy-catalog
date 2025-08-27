import { createClient } from '@/lib/supabase/server'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { prisma } from '@/lib/prisma'
import { AccountType } from '@prisma/client'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { ADMIN_EMAILS, getAdminProfile } from '@/lib/admin-config'

export async function getUser() {
  // Check for admin session
  const cookieStore = cookies()
  const adminSession = cookieStore.get('admin-session')
  const testUserBypass = cookieStore.get('test-user-bypass')
  
  // Handle admin session
  if (adminSession?.value === 'admin@catfy.com') {
    return {
      id: 'admin-profile-id',
      email: 'admin@catfy.com',
      user_metadata: {
        full_name: 'Admin User',
        first_name: 'Admin',
        last_name: 'User',
        account_type: 'BUSINESS',
        company_name: 'CATFY Administration',
        phone: '+1-555-ADMIN',
        website: 'https://catfy.com',
      },
      app_metadata: {
        provider: 'admin',
        providers: ['admin'],
      },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as any
  }
  
  // Check for test user bypass
  if (testUserBypass?.value === 'test@catfy.com') {
    // Return mock user data for test@catfy.com
    return {
      id: 'test-profile-id',
      email: 'test@catfy.com',
      user_metadata: {
        full_name: 'Test User',
        first_name: 'Test',
        last_name: 'User',
        account_type: 'BUSINESS',
        company_name: 'Test Company Inc.',
        phone: '+1-555-0123',
        website: 'https://testcompany.com',
      },
      app_metadata: {
        provider: 'test',
        providers: ['test'],
      },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as any
  }
  
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
  if (user.id === 'admin-profile-id' || user.email === 'admin@catfy.com') {
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
  
  // Handle test user - create profile in database if it doesn't exist
  if (user.id === 'test-profile-id' || user.email === 'test@catfy.com') {
    let testProfile = await prisma.profile.findUnique({
      where: { id: 'test-profile-id' },
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
    
    if (!testProfile) {
      testProfile = await prisma.profile.create({
        data: {
          id: 'test-profile-id',
          email: 'test@catfy.com',
          firstName: 'John',
          lastName: 'Doe',
          fullName: 'John Doe',
          accountType: 'BUSINESS',
          companyName: 'Test Company Inc.',
          phone: '+1-555-0123',
          website: 'https://testcompany.com',
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
    
    return testProfile
  }
  
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
  window.location.href = '/'
}

export async function isAdmin(userId?: string) {
  const user = userId ? { id: userId } : await getUser()
  
  if (!user) {
    return false
  }
  
  // Check if user is admin using the admin configuration
  return ADMIN_EMAILS.includes(user.email || '') || user.email?.includes('admin') || false
}

export async function requireAdmin() {
  const user = await requireAuth()
  const admin = await isAdmin(user.id)
  
  if (!admin) {
    redirect('/dashboard')
  }
  
  return user
}