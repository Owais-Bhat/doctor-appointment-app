import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireUser } from '@/lib/api-auth'

export async function GET(request: Request) {
  const auth = await requireUser(request, ['doctor'])
  if (auth instanceof NextResponse) return auth
  const uid = auth.uid

  const { data, error } = await supabaseAdmin
    .from('doctor_profiles')
    .select('*, profiles!doctor_profiles_profile_id_fkey(full_name, email)')
    .eq('profile_id', uid)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  return NextResponse.json({ profile: data })
}

/** A list of short strings (tags), cleaned and de-duplicated. */
function tags(v: unknown, maxItems: number, maxLen: number): string[] | null {
  if (!Array.isArray(v)) return null
  const out: string[] = []
  for (const x of v) {
    if (typeof x !== 'string') return null
    const t = x.trim().replace(/\s+/g, ' ')
    if (!t) continue
    if (t.length > maxLen) return null
    if (!out.some((o) => o.toLowerCase() === t.toLowerCase())) out.push(t)
  }
  return out.length > maxItems ? null : out
}

export async function PATCH(request: Request) {
  const auth = await requireUser(request, ['doctor'])
  if (auth instanceof NextResponse) return auth
  const uid = auth.uid

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  const bad = (error: string) => NextResponse.json({ error }, { status: 400 })
  const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

  const updates: Record<string, unknown> = {}
  if (body.specialty !== undefined) {
    const sp = str(body.specialty, 100)
    if (!sp) return bad('Enter your specialty')
    updates.specialty = sp
  }
  if (body.consultation_fee !== undefined) {
    const fee = Number(body.consultation_fee)
    if (!Number.isFinite(fee) || fee < 0 || fee > 100000) return bad('Enter a fee between 0 and 1,00,000')
    updates.consultation_fee = Math.round(fee * 100) / 100
  }
  if (body.experience_years !== undefined) {
    const years = Number(body.experience_years)
    if (!Number.isInteger(years) || years < 0 || years > 70) return bad('Enter your years of experience (0–70)')
    updates.experience_years = years
  }
  if (body.bio !== undefined) updates.bio = str(body.bio, 2000) || null
  if (body.clinic_name !== undefined) updates.clinic_name = str(body.clinic_name, 120) || null
  if (body.clinic_address !== undefined) updates.clinic_address = str(body.clinic_address, 300) || null
  if (body.qualifications !== undefined) {
    const q = tags(body.qualifications, 12, 60)
    if (!q) return bad('Up to 12 qualifications, 60 characters each')
    updates.qualifications = q
  }
  if (body.languages !== undefined) {
    const l = tags(body.languages, 12, 30)
    if (!l) return bad('Up to 12 languages')
    updates.languages = l
  }

  let fullName: string | undefined
  if (body.full_name !== undefined) {
    fullName = str(body.full_name, 100).replace(/^dr\.?\s+/i, '')
    if (!fullName) return bad('Enter your name')
  }
  if (Object.keys(updates).length === 0 && !fullName) return bad('Nothing to update')

  if (Object.keys(updates).length > 0) {
    const { error } = await supabaseAdmin.from('doctor_profiles').update(updates).eq('profile_id', uid)
    if (error) return NextResponse.json({ error: 'Couldn’t save your profile' }, { status: 500 })
  }
  if (fullName) {
    const { error } = await supabaseAdmin.from('profiles').update({ full_name: fullName }).eq('id', uid)
    if (error) return NextResponse.json({ error: 'Couldn’t save your name' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
