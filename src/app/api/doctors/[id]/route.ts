import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params

  const { data, error } = await supabaseAdmin
    .from('doctor_profiles')
    .select(`
      id, profile_id, specialty, bio, qualifications,
      experience_years, consultation_fee, rating, total_reviews,
      is_verified, clinic_name, clinic_address, languages, registration_number, registration_council,
      profiles!doctor_profiles_profile_id_fkey(full_name, email, avatar_url)
    `)
    .eq('id', id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })

  return NextResponse.json({ doctor: data })
}
