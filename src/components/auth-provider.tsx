'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  loading: boolean
  isTestUser: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isTestUser: false,
})

const supabase = createClient()

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isTestUser, setIsTestUser] = useState(false)

  useEffect(() => {
    // Check for test user bypass
    const checkTestUser = () => {
      const cookies = document.cookie.split(';')
      const testUserCookie = cookies.find(cookie => 
        cookie.trim().startsWith('test-user-bypass=')
      )
      
      if (testUserCookie) {
        const email = testUserCookie.split('=')[1]
        if (email === 'test@catfy.com') {
          setIsTestUser(true)
          setUser({
            id: 'test-user-id',
            email: 'test@catfy.com',
            user_metadata: {
              full_name: 'John Doe',
              first_name: 'John',
              last_name: 'Doe',
              account_type: 'BUSINESS',
              company_name: 'Test Company Inc.',
              phone: '+1-555-0123',
              website: 'https://testcompany.com',
              profile_id: 'test-profile-id',
              subscription_status: 'ACTIVE',
              billing_cycle: 'YEARLY',
              current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            },
            app_metadata: {
              provider: 'test',
              providers: ['test'],
            },
            aud: 'authenticated',
            created_at: new Date().toISOString(),
          } as User)
          setLoading(false)
          return true
        }
      }
      return false
    }

    if (checkTestUser()) {
      return
    }

    // Regular Supabase auth
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } catch (error) {
        console.error('Error getting user:', error)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (isTestUser) return // Don't override test user
        
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [isTestUser])

  return (
    <AuthContext.Provider value={{ user, loading, isTestUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}