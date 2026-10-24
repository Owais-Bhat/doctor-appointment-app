import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SESSION_COOKIE, readSessionRole, type SessionRole } from '@/lib/session'

const HOME: Record<SessionRole, string> = {
  patient: '/client/dashboard',
  doctor: '/admin/dashboard',
  super_admin: '/super-admin/dashboard',
}

function portalOf(path: string): SessionRole | null {
  if (path === '/super-admin' || path.startsWith('/super-admin/')) return 'super_admin'
  if (path === '/admin' || path.startsWith('/admin/')) return 'doctor'
  if (path === '/client' || path.startsWith('/client/')) return 'patient'
  return null
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Sign-in pages are always reachable
  if (path.startsWith('/auth/login') || path.startsWith('/super-admin/login')) {
    return NextResponse.next()
  }

  const needs = portalOf(path)
  if (!needs) return NextResponse.next()

  // Only trust a role cookie carrying a valid server signature
  const role = await readSessionRole(request.cookies.get(SESSION_COOKIE)?.value)

  // Signed out: sign in, then come back here
  if (!role) {
    const login = new URL(needs === 'super_admin' ? '/super-admin/login' : '/auth/login', request.url)
    login.searchParams.set('next', path + request.nextUrl.search)
    return NextResponse.redirect(login)
  }

  // Signed in to another portal (admins included): go to your own home
  if (role !== needs) {
    return NextResponse.redirect(new URL(HOME[role], request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/client/:path*', '/admin/:path*', '/super-admin/:path*'],
}

