import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const roleCookie = request.cookies.get('userRole');
  const role = roleCookie?.value;
  const path = request.nextUrl.pathname;

  // 1. ALWAYS allow access to login pages so users can actually authenticate
  if (path.startsWith('/auth/login') || path.startsWith('/super-admin/login')) {
    return NextResponse.next()
  }

  const isProtectedRoute = path.startsWith('/client') ||
                           path.startsWith('/admin') ||
                           path.startsWith('/super-admin')

  // 2. If not logged in, force them to the main login page
  if (!role) {
    if (isProtectedRoute) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    return NextResponse.next()
  }

  // 3. SUPER ADMIN BYPASS: The boss can go anywhere!
  if (role === 'super_admin') {
    return NextResponse.next();
  }

  // 4. Role-based protection for Doctors and Patients
  if (path.startsWith('/client') && role !== 'patient') {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (path.startsWith('/admin') && role !== 'doctor') {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/client/:path*',
    '/admin/:path*',
    '/super-admin/:path*'
  ],
}
