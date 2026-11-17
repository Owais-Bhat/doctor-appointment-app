export type Role = 'patient' | 'doctor' | 'super_admin'

export const HOME: Record<Role, string> = {
  patient: '/client/dashboard',
  doctor: '/admin/dashboard',
  super_admin: '/super-admin/dashboard',
}

const AREA: Record<Role, string> = {
  patient: '/client/',
  doctor: '/admin/',
  super_admin: '/super-admin/',
}

export function normalizeRole(role: unknown): Role {
  const r = String(role || '').trim().toLowerCase().replace(/[-_\s]/g, '')
  if (r === 'admin' || r.startsWith('super')) return 'super_admin'
  if (r === 'doctor') return 'doctor'
  return 'patient'
}

/**
 * Where to go after sign-in: the `next` page if it is a same-site path the
 * role may open, otherwise the role's home. Blocks open redirects such as
 * "//evil.com" or "https://evil.com".
 */
export function afterSignIn(role: unknown, next: string | null | undefined): string {
  const cleanRole = normalizeRole(role)
  if (next && typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\')) {
    const area = AREA[cleanRole]
    if (area && next.startsWith(area)) return next
  }
  return HOME[cleanRole] || '/client/dashboard'
}

/** Firebase auth error codes in words a person can act on. */
export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? (err instanceof Error ? err.message : '')
  const c = code.toLowerCase()
  if (c.includes('invalid-credential') || c.includes('wrong-password') || c.includes('user-not-found') || c.includes('invalid-login-credentials')) {
    return 'That email and password don’t match. Check them or reset your password.'
  }
  if (c.includes('invalid-email')) return 'Enter a valid email address.'
  if (c.includes('email-already-in-use') || c.includes('email-already-exists')) return 'An account with this email already exists. Sign in instead.'
  if (c.includes('weak-password')) return 'Use at least 8 characters for your password.'
  if (c.includes('too-many-requests')) return 'Too many attempts. Wait a few minutes or reset your password.'
  if (c.includes('network-request-failed')) return 'No connection. Check your internet and try again.'
  if (c.includes('popup-closed') || c.includes('cancelled-popup')) return ''
  if (c.includes('popup-blocked')) return 'Your browser blocked the Google window. Allow pop-ups for this site and try again.'
  if (c.includes('user-disabled')) return 'This account has been suspended. Contact support.'
  return 'Unable to sign in. If you signed in with Google, please use “Continue with Google”, or use “Forgot password?”.'
}
