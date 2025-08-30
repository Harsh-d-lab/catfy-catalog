import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
// Note: Prisma cannot be used in middleware due to Edge Runtime limitations
// import { PrismaClient } from '@prisma/client'
// const prisma = new PrismaClient()

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Bypass authentication for test@catfy.com and admin session
  const bypassEmail = 'test@catfy.com'
  const isTestUser = request.cookies.get('test-user-bypass')?.value === bypassEmail
  const adminSession = request.cookies.get('admin-session')?.value
  const isAdminUser = adminSession === 'admin@catfy.com'

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  if (!isTestUser) {
    await supabase.auth.getUser()
  }

  // Protected routes
  const protectedPaths = [
    '/dashboard',
    '/onboarding',
    '/themes',
    '/catalogues',
    '/billing',
    '/admin',
  ]

  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  )

  if (isProtectedPath) {
    // Allow test user and admin to bypass authentication
    if (isTestUser || isAdminUser) {
      return response
    }
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      const redirectUrl = new URL('/auth', request.url)
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Admin routes (exclude admin login page)
  if (request.nextUrl.pathname.startsWith('/admin') && !request.nextUrl.pathname.startsWith('/admin/login')) {
    // Allow test user and admin session to bypass authentication for admin routes
    if (isTestUser || isAdminUser) {
      return response
    }
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    // Check if user is admin (you can implement your own logic here)
    // For now, we'll check if the user email is in an admin list
    const adminEmails = ['admin@catfy.com', 'test@catfy.com']
    if (!adminEmails.includes(user.email || '') && !user.email?.includes('admin')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Redirect authenticated users away from auth pages
  if (request.nextUrl.pathname.startsWith('/auth')) {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const redirectTo = request.nextUrl.searchParams.get('redirect') || '/dashboard'
      return NextResponse.redirect(new URL(redirectTo, request.url))
    }
  }

  // Catalogue access control for team collaboration
  // Note: Temporarily disabled due to Prisma Edge Runtime limitations
  // This check should be moved to the actual page components or API routes
  /*
  const catalogueEditMatch = request.nextUrl.pathname.match(/^\/catalogue\/([^/]+)\/edit/)
  if (catalogueEditMatch && !isTestUser && !isAdminUser) {
    const catalogueId = catalogueEditMatch[1]
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      try {
        // Check if user owns the catalogue or is a team member
        const hasAccess = await prisma.catalogue.findFirst({
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
          }
        })

        if (!hasAccess) {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }
      } catch (error) {
        console.error('Error checking catalogue access:', error)
        // Allow access on error to prevent blocking legitimate users
      }
    }
  }
  */

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes that don't require auth
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api/webhooks).*)',
  ],
}