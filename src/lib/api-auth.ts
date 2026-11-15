import { NextResponse } from 'next/server'
import { verifyFirebaseToken } from './firebase-admin'
import { supabaseAdmin } from './supabase-admin'
import { isDemoUid } from './demo-auth'

export type UserRole = 'patient' | 'doctor' | 'super_admin'

export type AuthedUser = { uid: string; role: UserRole }

/**
 * Verify the Firebase ID token sent as `Authorization: Bearer <token>`.
 * Returns the uid, or null when the token is missing or invalid.
 *
 * Never trust user ids or roles sent in headers or request bodies —
 * the token is the only source of identity.
 */
export async function verifyTokenDetailed(request: Request): Promise<{ uid: string | null; error?: string }> {
  const auth = request.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return { uid: null, error: 'Missing or malformed Authorization header' }
  const token = auth.slice(7)

  const demoEnabled = process.env.NODE_ENV !== 'production' && !process.env.FIREBASE_ADMIN_PRIVATE_KEY
  if (demoEnabled && token.startsWith('demo:')) {
    const uid = token.slice(5)
    return isDemoUid(uid) ? { uid } : { uid: null, error: 'Invalid demo user id' }
  }

  try {
    const decoded = await verifyFirebaseToken(token)
    return { uid: decoded.uid }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('verifyToken failed:', msg)
    return { uid: null, error: msg }
  }
}

export async function verifyToken(request: Request): Promise<string | null> {
  const res = await verifyTokenDetailed(request)
  return res.uid
}

export const unauthorized = (details?: string) =>
  NextResponse.json({ error: 'Unauthorized', ...(details ? { details } : {}) }, { status: 401 })
export const forbidden = () => NextResponse.json({ error: 'Forbidden' }, { status: 403 })

/**
 * Verify the token and load the user's role from the database.
 * When `roles` is given, the user must have one of them.
 *
 * Usage:
 *   const auth = await requireUser(request, ['super_admin'])
 *   if (auth instanceof NextResponse) return auth
 *   auth.uid, auth.role
 */
export async function requireUser(
  request: Request,
  roles?: UserRole[],
): Promise<AuthedUser | NextResponse> {
  const result = await verifyTokenDetailed(request)
  if (!result.uid) return unauthorized(result.error)

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role, is_active')
    .eq('id', result.uid)
    .maybeSingle()

  if (profile && profile.is_active === false) return forbidden()

  const role = (profile?.role ?? 'patient') as UserRole
  if (roles && !roles.includes(role)) return forbidden()

  return { uid: result.uid, role }
}
