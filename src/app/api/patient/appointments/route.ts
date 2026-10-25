import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyToken, unauthorized } from '@/lib/api-auth'
import { paymentsEnabled } from '@/lib/payments'

export async function GET(request: Request) {
  const uid = await verifyToken(request)
  if (!uid) return unauthorized()

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
    const validAppointments = (data ?? []).filter(apt => apt.doctor_profiles !== null)

    return NextResponse.json({ appointments: validAppointments, paymentsEnabled: paymentsEnabled() })
  } catch (err) {
    console.error('Unexpected error in patient appointments:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
