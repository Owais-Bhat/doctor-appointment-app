import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyToken, unauthorized } from '@/lib/api-auth'

export async function GET(request: Request) {
  const uid = await verifyToken(request)
  if (!uid) return unauthorized()

  const { data, error } = await supabaseAdmin
    .from('doctor_profiles')
    .select('*, profiles!doctor_profiles_profile_id_fkey(full_name, email)')
    .eq('profile_id', uid)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  return NextResponse.json({ profile: data })
}

export async function PATCH(request: Request) {
  const uid = await verifyToken(request)
  if (!uid) return unauthorized()

  const body = await request.json()
  const { specialty, consultation_fee, experience_years, bio } = body

  const updates: Record<string, any> = {}
  if (specialty !== undefined) updates.specialty = specialty
  if (consultation_fee !== undefined) updates.consultation_fee = parseFloat(consultation_fee)
  if (experience_years !== undefined) updates.experience_years = parseInt(experience_years)
  if (bio !== undefined) updates.bio = bio

  const { error } = await supabaseAdmin
    .from('doctor_profiles')
    .update(updates)
    .eq('profile_id', uid)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
