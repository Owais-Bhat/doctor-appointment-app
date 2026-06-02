import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { adminAuth } from '@/lib/firebase-admin'

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return NextResponse.json({ profile: null }, { status: 401 })

  let decoded: { uid: string; email?: string; name?: string }
  try {
    decoded = await adminAuth.verifyIdToken(auth.slice(7))
  } catch {
    return NextResponse.json({ profile: null }, { status: 401 })
  }

  const { data: existing } = await supabaseAdmin
    .from('profiles')
    .select('role, full_name, email')
    .eq('id', decoded.uid)
    .single()

  if (existing) return NextResponse.json({ profile: existing, uid: decoded.uid })

  // First sign-in: create profile as patient
  const { data: created } = await supabaseAdmin
    .from('profiles')
    .insert({
      id: decoded.uid,
      full_name: decoded.name ?? 'New User',
      email: decoded.email ?? '',
      role: 'patient',
    })
    .select('role, full_name, email')
    .single()

  return NextResponse.json({ profile: created, uid: decoded.uid })
}
