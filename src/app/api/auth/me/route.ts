import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { adminAuth } from '@/lib/firebase-admin'

export async function GET(request: Request) {
  try {
    const auth = request.headers.get('authorization')
    if (!auth?.startsWith('Bearer ')) {
      return NextResponse.json({ profile: null, error: 'Missing authorization' }, { status: 401 })
    }

    let decoded: { uid: string; email?: string; name?: string }
    try {
      decoded = await adminAuth.verifyIdToken(auth.slice(7))
    } catch (err) {
      console.error('Token verification failed:', err)
      return NextResponse.json({ profile: null, error: 'Invalid token' }, { status: 401 })
    }

    const { data: existing, error: selectError } = await supabaseAdmin
      .from('profiles')
      .select('id, role, full_name, email')
      .eq('id', decoded.uid)
      .single()

    if (selectError && selectError.code !== 'PGRST116') {
      // PGRST116 is "No rows found" - that's okay, we'll create one
      console.error('Error fetching profile:', selectError)
      return NextResponse.json({ profile: null, error: 'Database error' }, { status: 500 })
    }

    if (existing) {
      return NextResponse.json({ profile: existing, uid: decoded.uid })
    }

    // First sign-in: create profile as patient
    const { data: created, error: createError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: decoded.uid,
        full_name: decoded.name ?? 'New User',
        email: decoded.email ?? '',
        role: 'patient',
      })
      .select('id, role, full_name, email')
      .single()

    if (createError) {
      console.error('Error creating profile:', createError)
      return NextResponse.json({ profile: null, error: 'Failed to create profile' }, { status: 500 })
    }

    return NextResponse.json({ profile: created, uid: decoded.uid })
  } catch (err) {
    console.error('Unexpected error in auth/me:', err)
    return NextResponse.json({ profile: null, error: 'Internal server error' }, { status: 500 })
  }
}
