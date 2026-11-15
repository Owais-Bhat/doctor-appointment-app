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
export async function verifyToken(request: Request): Promise<string | null> {
  const auth = request.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null
  const token = auth.slice(7)

  const demoEnabled = process.env.NODE_ENV !== 'production' && !process.env.FIREBASE_ADMIN_PRIVATE_KEY
  if (demoEnabled && token.startsWith('demo:')) {
    const uid = token.slice(5)
    return isDemoUid(uid) ? uid : null
  }

  try {
    const decoded = await verifyFirebaseToken(token)
    return decoded.uid
  } catch (err) {
    console.error('verifyToken failed:', err)
    return null
  }
}

export const unauthorized = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
  const uid = await verifyToken(request)
  if (!uid) return unauthorized()

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role, is_active')
    .eq('id', uid)
    .maybeSingle()

  if (profile && profile.is_active === false) return forbidden()

  const role = (profile?.role ?? 'patient') as UserRole
  if (roles && !roles.includes(role)) return forbidden()

  return { uid, role }
}
