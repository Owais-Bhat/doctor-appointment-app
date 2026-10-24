import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/api-auth'
import { SESSION_COOKIE, SESSION_MAX_AGE, createSessionValue } from '@/lib/session'

export async function POST(request: Request) {
  const auth = await requireUser(request)
  if (auth instanceof NextResponse) return auth

  let value: string
  try {
    value = await createSessionValue(auth.role)
  } catch (err) {
    console.error('Session error:', err)
    return NextResponse.json({ error: 'Session not configured' }, { status: 500 })
  }

  const res = NextResponse.json({ ok: true, role: auth.role })
  res.cookies.set(SESSION_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 })
  return res
}
