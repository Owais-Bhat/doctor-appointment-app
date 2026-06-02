import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('doctor_profiles')
    .select(`
      id,
      profile_id,
      specialty,
      bio,
      qualifications,
      experience_years,
      consultation_fee,
      rating,
      total_reviews,
      is_verified,
      clinic_name,
      languages,
      profiles!doctor_profiles_profile_id_fkey (
        full_name,
        email,
        avatar_url
      )
    `)
    .eq('is_verified', true)
    .order('rating', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ doctors: data ?? [] })
}
