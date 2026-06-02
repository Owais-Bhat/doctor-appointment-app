import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { adminAuth } from '@/lib/firebase-admin'

export async function POST(request: Request) {
  try {
    const { token, fullName } = await request.json()
    if (!token || !fullName?.trim()) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const decoded = await adminAuth.verifyIdToken(token)

    const { error } = await supabaseAdmin.from('profiles').upsert({
      id: decoded.uid,
      full_name: fullName.trim(),
      email: decoded.email ?? '',
      role: 'patient',
    }, { onConflict: 'id' })

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
