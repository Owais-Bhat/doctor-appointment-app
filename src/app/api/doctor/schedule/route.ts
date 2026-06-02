import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyToken, unauthorized } from '@/lib/api-auth'

export async function GET(request: Request) {
  const uid = await verifyToken(request)
  if (!uid) return unauthorized()

  const { data: doctorProfile } = await supabaseAdmin
    .from('doctor_profiles')
    .select('id')
    .eq('profile_id', uid)
    .single()

  if (!doctorProfile) return NextResponse.json({ appointments: [], doctor: null })

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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ appointments: data ?? [], doctorProfileId: doctorProfile.id })
}
