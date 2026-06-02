import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  try {
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

    if (error) {
      console.error('Error fetching doctors:', error)
      return NextResponse.json({ error: 'Failed to fetch doctors', doctors: [] }, { status: 200 })
    }

    // Filter out doctors with missing profile data
    const validDoctors = (data ?? []).filter(doc => doc.profiles !== null)

    return NextResponse.json({ doctors: validDoctors, count: validDoctors.length })
  } catch (err) {
    console.error('Unexpected error in doctors API:', err)
    return NextResponse.json({ error: 'Internal server error', doctors: [] }, { status: 200 })
  }
}
