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

export async function PATCH(request: Request) {
  const auth = await requireUser(request, ['doctor'])
  if (auth instanceof NextResponse) return auth
  const uid = auth.uid

  const body = await request.json()
  const { specialty, consultation_fee, experience_years, bio } = body

  const updates: Record<string, string | number> = {}
  if (specialty !== undefined) updates.specialty = String(specialty).slice(0, 100)
  if (consultation_fee !== undefined) {
    const fee = parseFloat(consultation_fee)
    if (!Number.isFinite(fee) || fee < 0) return NextResponse.json({ error: 'Invalid consultation fee' }, { status: 400 })
    updates.consultation_fee = fee
  }
  if (experience_years !== undefined) {
    const years = parseInt(experience_years)
    if (!Number.isInteger(years) || years < 0 || years > 80) return NextResponse.json({ error: 'Invalid experience' }, { status: 400 })
    updates.experience_years = years
  }
  if (bio !== undefined) updates.bio = String(bio).slice(0, 5000)

  const { error } = await supabaseAdmin
    .from('doctor_profiles')
    .update(updates)
    .eq('profile_id', uid)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
