import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyFirebaseToken } from '@/lib/firebase-admin'
import { claimSeededProfile } from '@/lib/seed-claim'

/**
 * POST /api/auth/register  { token, fullName }
 * Creates the MedFlow profile for a newly registered Firebase user.
 * Every new account is a patient; an existing profile only gets its name
 * updated, so this can never change someone's role.
 */
export async function POST(request: Request) {
  let body: { token?: string; fullName?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const fullName = typeof body.fullName === 'string' ? body.fullName.trim().slice(0, 120) : ''
  if (typeof body.token !== 'string' || !body.token || !fullName) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  let decoded: { uid: string; email?: string; email_verified?: boolean }
  try {
    decoded = await verifyFirebaseToken(body.token)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // This email may have a role reserved for it (mysql/seed-super-admin.sql).
  // It is only handed over once the address is verified.
  const claim = await claimSeededProfile(decoded.uid, decoded.email, decoded.email_verified === true)
  const verifyEmail = claim === 'needs_verified_email'

  const { data: existing } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('id', decoded.uid)
    .maybeSingle()

  const { error } = existing
    ? await supabaseAdmin.from('profiles').update({ full_name: fullName, updated_at: new Date().toISOString() }).eq('id', decoded.uid)
    : await supabaseAdmin.from('profiles').insert({ id: decoded.uid, full_name: fullName, email: verifyEmail ? '' : (decoded.email ?? '').toLowerCase(), role: 'patient' })

  if (error) {
    console.error('Register profile error:', error)
    return NextResponse.json({ error: 'Could not save your profile' }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
