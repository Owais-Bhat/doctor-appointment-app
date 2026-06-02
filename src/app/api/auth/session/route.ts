import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: Request) {
  const uid = await verifyToken(request)
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', uid)
    .single()

  const role = profile?.role ?? 'patient'

  const res = NextResponse.json({ ok: true })
  res.cookies.set('userRole', role, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set('userRole', '', { httpOnly: true, path: '/', maxAge: 0 })
  return res
}
