import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyTokenDetailed } from '@/lib/api-auth'
import { claimSeededProfile } from '@/lib/seed-claim'

export async function GET(request: Request) {
  try {
    const auth = request.headers.get('authorization')
    if (!auth?.startsWith('Bearer ')) {
      return NextResponse.json({ profile: null, error: 'Missing authorization' }, { status: 401 })
    }

    const result = await verifyTokenDetailed(request)
    if (!result.uid) {
      return NextResponse.json({ profile: null, error: 'Invalid token', details: result.error }, { status: 401 })
    }
    const uid = result.uid

    // An admin role reserved for this email (mysql/seed-super-admin.sql) is handed over here
    const claim = await claimSeededProfile(uid, result.email, result.emailVerified === true)

    // 1. Try to find existing profile by UID
    const { data: existing, error: selectError } = await supabaseAdmin
      .from('profiles')
      .select('id, role, full_name, email')
      .eq('id', uid)
      .maybeSingle()

    if (selectError) {
      console.error('Error fetching profile:', selectError)
      return NextResponse.json({ profile: null, error: 'Database error' }, { status: 500 })
    }

    if (existing) {
      return NextResponse.json({ profile: existing, uid })
    }

    // 2. Check if a profile with this email was pre-configured or seeded in MySQL
    const email = (result.email ?? '').trim().toLowerCase()
    if (email && result.emailVerified) {
      const { data: byEmail } = await supabaseAdmin
        .from('profiles')
        .select('id, role, full_name, email')
        .eq('email', email)
        .limit(1)

      const match = byEmail?.[0]
      if (match) {
        // Link this profile to the Firebase UID
        await supabaseAdmin
          .from('profiles')
          .update({ id: uid, updated_at: new Date().toISOString() })
          .eq('id', match.id)

        return NextResponse.json({ profile: { ...match, id: uid }, uid })
      }
    }

    // First sign-in: create profile as patient
    const { data: created, error: createError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: uid,
        full_name: 'New User',
        email: claim === 'needs_verified_email' ? '' : email,
        role: 'patient',
      })
      .select('id, role, full_name, email')
      .single()

    if (createError) {
      console.error('Error creating profile:', createError)
      return NextResponse.json({ profile: null, error: 'Failed to create profile' }, { status: 500 })
    }

    return NextResponse.json({ profile: created, uid })
  } catch (err) {
    console.error('Unexpected error in auth/me:', err)
    return NextResponse.json({ profile: null, error: 'Internal server error' }, { status: 500 })
  }
}
