import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireUser } from '@/lib/api-auth'

export async function GET(request: Request) {
  const auth = await requireUser(request, ['doctor'])
  if (auth instanceof NextResponse) return auth
  const uid = auth.uid

  const { data: doctorProfile } = await supabaseAdmin
    .from('doctor_profiles')
    .select('id')
    .eq('profile_id', uid)
    .single()

  if (!doctorProfile) return NextResponse.json({ patients: [] })

  const { data, error } = await supabaseAdmin
    .from('appointments')
    .select(`
      patient_id,
      status,
      appointment_date,
      chief_complaint,
      profiles!appointments_patient_id_fkey (
        id,
        full_name,
        email,
        phone,
        blood_type,
        date_of_birth,
        health_stats
      )
    `)
    .eq('doctor_id', doctorProfile.id)
    .order('appointment_date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Deduplicate — one row per patient, keeping their most recent appointment
  const seen = new Set<string>()
  const patients = (data ?? []).filter(row => {
    if (seen.has(row.patient_id)) return false
    seen.add(row.patient_id)
    return true
  })

  return NextResponse.json({ patients })
}
