import { NextResponse } from 'next/server'
import { adminAuth } from './firebase-admin'
import { supabaseAdmin } from './supabase-admin'

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
  try {
    const decoded = await adminAuth.verifyIdToken(auth.slice(7))
    return decoded.uid
  } catch {
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

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('role, is_active')
    .eq('id', uid)
    .maybeSingle()

  if (error) return NextResponse.json({ error: 'Unable to verify account' }, { status: 503 })
  if (!profile || profile.is_active === false) return forbidden()

  const role = profile.role as UserRole
  if (!['patient', 'doctor', 'super_admin'].includes(role)) return forbidden()
  if (roles && !roles.includes(role)) return forbidden()

  return { uid, role }
}
