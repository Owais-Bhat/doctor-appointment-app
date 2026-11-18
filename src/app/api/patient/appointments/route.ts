import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireUser } from '@/lib/api-auth'
import { paymentsEnabled } from '@/lib/payments'
import { parsePrescription } from '@/lib/prescription'

export async function GET(request: Request) {
  // requireUser also refuses suspended accounts
  const auth = await requireUser(request)
  if (auth instanceof NextResponse) return auth
  const uid = auth.uid

  try {
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
        prescription,
        created_at,
        payment_status,
        amount_paid,
        payment_currency,
        paid_at,
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

    if (error) {
      console.error('Error fetching patient appointments:', error)
      return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 })
    }

    // Filter out appointments with invalid doctor data
    // Which visits already have this patient's review, so the app can offer "Rate" on the others
    const { data: mine } = await supabaseAdmin.from('reviews').select('appointment_id').eq('patient_id', uid)
    const reviewed = new Set((mine ?? []).map(r => r.appointment_id))

    // The list only needs to know a prescription exists; the visit screen loads it
    const validAppointments = (data ?? [])
      .filter(apt => apt.doctor_profiles !== null)
      .map(({ prescription, ...apt }) => ({ ...apt, has_prescription: !!parsePrescription(prescription), reviewed: reviewed.has(apt.id) }))

    return NextResponse.json({ appointments: validAppointments, paymentsEnabled: paymentsEnabled() })
  } catch (err) {
    console.error('Unexpected error in patient appointments:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
