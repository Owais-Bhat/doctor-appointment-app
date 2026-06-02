import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyToken, unauthorized } from '@/lib/api-auth'

export async function GET(request: Request) {
  const uid = await verifyToken(request)
  if (!uid) return unauthorized()

  try {
    const { data: doctorProfile, error: doctorError } = await supabaseAdmin
      .from('doctor_profiles')
      .select('id')
      .eq('profile_id', uid)
      .single()

    if (doctorError || !doctorProfile) {
      return NextResponse.json({ appointments: [], doctorProfileId: null }, { status: 200 })
    }

    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabaseAdmin
      .from('appointments')
      .select(`
        id,
        appointment_date,
        appointment_time,
        status,
        consultation_type,
        chief_complaint,
        profiles!appointments_patient_id_fkey (
          id,
          full_name,
          phone
        )
      `)
      .eq('doctor_id', doctorProfile.id)
      .eq('appointment_date', today)
      .order('appointment_time', { ascending: true })

    if (error) {
      console.error('Error fetching doctor schedule:', error)
      return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 })
    }

    return NextResponse.json({
      appointments: data ?? [],
      doctorProfileId: doctorProfile.id
    })
  } catch (err) {
    console.error('Unexpected error in doctor schedule:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
