export type Role = 'patient' | 'doctor' | 'super_admin'

export const HOME: Record<Role, string> = {
  patient: '/client/dashboard',
  doctor: '/admin/dashboard',
  super_admin: '/super-admin/dashboard',
}

const AREA: Record<Role, string> = { patient: '/client/', doctor: '/admin/', super_admin: '/super-admin/' }

/**
 * Where to go after sign-in: the `next` page if it is a same-site path the
 * role may open, otherwise the role's home. Blocks open redirects such as
 * "//evil.com" or "https://evil.com".
 */
export function afterSignIn(role: Role, next: string | null): string {
  if (next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\')) {
    if (next.startsWith(AREA[role])) return next
  }
  return HOME[role]
}

/** Firebase auth error codes in words a person can act on. */
export function authErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? ''
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-login-credentials':
      return 'That email and password don’t match. Check them or reset your password.'
    case 'auth/invalid-email':
      return 'Enter a valid email address.'
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Sign in instead.'
    case 'auth/weak-password':
      return 'Use at least 8 characters for your password.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a few minutes or reset your password.'
    case 'auth/network-request-failed':
      return 'No connection. Check your internet and try again.'
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return ''
    case 'auth/popup-blocked':
      return 'Your browser blocked the Google window. Allow pop-ups for this site and try again.'
    case 'auth/user-disabled':
      return 'This account has been suspended. Contact support.'
    default:
      return 'Something went wrong. Please try again.'
  }
}
