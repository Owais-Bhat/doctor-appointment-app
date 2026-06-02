import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyToken, unauthorized } from '@/lib/api-auth'

export async function GET(request: Request) {
  const uid = await verifyToken(request)
  if (!uid) return unauthorized()

  const { data, error } = await supabaseAdmin
    .from('appointments')
    .select(`
      id,
      appointment_date,
      appointment_time,
      status,
      consultation_type,
      chief_complaint,
      notes,
      follow_up_date,
      created_at,
      doctor_profiles!appointments_doctor_id_fkey (
        id,
        specialty,
        consultation_fee,
        profiles!doctor_profiles_profile_id_fkey (
          full_name
        )
      )
    `)
    .eq('patient_id', uid)
    .order('appointment_date', { ascending: true })
    .order('appointment_time', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ appointments: data ?? [] })
}
