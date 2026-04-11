import { NextResponse } from 'next/server'

export function middleware(request) {
  const { pathname } = request.nextUrl

  // Check for auth cookie
  const authCookie = request.cookies.get('tsf-portal-auth')
  const isAuthenticated = authCookie?.value === 'authenticated'

  // Public paths that don't require authentication
  const publicPaths = ['/login', '/api/auth', '/_next', '/favicon.ico']
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

  // If trying to access protected path without auth, redirect to login
  if (!isAuthenticated && (pathname.startsWith('/portal') || pathname.startsWith('/api/data') || pathname.startsWith('/api/notion-page'))) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If authenticated and trying to access login, allow it (no redirect needed)
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|favicon.ico).*)'],
}
