import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const cookies = request.cookies.getAll()
          return cookies
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
          })
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  let user = null
  let authError = null
  
  try {
    const { data: { user: authUser }, error } = await supabase.auth.getUser()
    user = authUser
    authError = error
    
    // Add debugging for API routes
    if (request.nextUrl.pathname.startsWith('/api/')) {
      console.log('Middleware - API route:', request.nextUrl.pathname)
      
      // Only log Auth session missing as info, not error
      if (error?.name === 'AuthSessionMissingError') {
        console.log('Middleware - Auth session missing (expected for unauthenticated requests)')
      } else if (error) {
        console.log('Middleware - Auth error:', error.message)
      }
      
      console.log('Middleware - User:', user ? `${user.id} (${user.email})` : 'null')
      console.log('Middleware - Cookies count:', request.cookies.getAll().length)
      
      // Check for auth token
      const authCookie = request.cookies.get('sb-udugwvkkmcwnspwjhlws-auth-token')
      console.log('Middleware - Auth cookie present:', !!authCookie)
    }
  } catch (error) {
    authError = error
    console.error('Middleware - Auth check failed:', error)
  }

  // Protect API routes (except public ones)
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const publicRoutes = ['/api/cron/', '/api/webhook/']
    const isPublicRoute = publicRoutes.some(route => 
      request.nextUrl.pathname.startsWith(route)
    )

    // Allow requests with Authorization header to pass through to API route
    const hasAuthHeader = request.headers.get('authorization')

    if (!isPublicRoute && !user && !hasAuthHeader) {
      console.log('Middleware - Blocking unauthenticated request to:', request.nextUrl.pathname)
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (hasAuthHeader) {
      console.log('Middleware - Allowing request with Authorization header to pass through')
    }
  }

  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard') && !user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/auth/login'
    redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 