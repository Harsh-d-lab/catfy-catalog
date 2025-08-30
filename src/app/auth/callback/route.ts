import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createOrUpdateProfile } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const type = requestUrl.searchParams.get('type')

  if (error) {
    console.error('Auth callback error:', error, errorDescription)
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(errorDescription || error)}`, requestUrl.origin)
    )
  }

  if (code) {
    const supabase = createClient()
    
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Code exchange error:', error)
        return NextResponse.redirect(
          new URL(`/auth/login?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
        )
      }

      // Check if this is a password recovery flow
      if (type === 'recovery') {
        return NextResponse.redirect(new URL('/auth/reset-password', requestUrl.origin))
      }

      if (data.user) {
        // Create or update user profile
        try {
          const fullName = data.user.user_metadata?.full_name || data.user.user_metadata?.name || ''
          const accountType = data.user.user_metadata?.account_type || 'INDIVIDUAL'
          await createOrUpdateProfile({
            email: data.user.email!,
            firstName: data.user.user_metadata?.first_name || fullName.split(' ')[0] || '',
            lastName: data.user.user_metadata?.last_name || fullName.split(' ').slice(1).join(' ') || '',
            accountType: accountType as 'INDIVIDUAL' | 'BUSINESS',
            companyName: data.user.user_metadata?.company_name,
          })
        } catch (profileError) {
          console.error('Profile creation error:', profileError)
          // Don't fail the auth flow for profile errors
        }

        // Check if this is a new user (first time login)
        const isNewUser = data.user.created_at === data.user.last_sign_in_at
        
        if (isNewUser) {
          // Redirect new users to onboarding
          return NextResponse.redirect(new URL('/onboarding', requestUrl.origin))
        } else {
          // Redirect existing users to dashboard or specified next URL
          return NextResponse.redirect(new URL(next, requestUrl.origin))
        }
      }
    } catch (err) {
      console.error('Auth callback error:', err)
      return NextResponse.redirect(
        new URL('/auth/login?error=Authentication failed', requestUrl.origin)
      )
    }
  }

  // No code provided, redirect to login
  return NextResponse.redirect(new URL('/auth/login', requestUrl.origin))
}