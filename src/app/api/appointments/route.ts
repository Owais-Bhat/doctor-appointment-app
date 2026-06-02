import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyToken, unauthorized } from '@/lib/api-auth'

export async function POST(request: Request) {
  const uid = await verifyToken(request)
  if (!uid) return unauthorized()

  try {
    const { doctorId, date, time, consultationType, chiefComplaint } = await request.json()

    if (!doctorId || !date || !time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check for double-booking
    const { data: existing } = await supabaseAdmin
      .from('appointments')
      .select('id')
      .eq('doctor_id', doctorId)
      .eq('appointment_date', date)
      .eq('appointment_time', time)
      .neq('status', 'cancelled')
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'This time slot is already booked' }, { status: 409 })
    }

    // Get patient name for notification
    const { data: patient } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('id', uid)
      .single()

    // Get doctor profile_id for notification
    const { data: doctor } = await supabaseAdmin
      .from('doctor_profiles')
      .select('profile_id, profiles!doctor_profiles_profile_id_fkey(full_name)')
      .eq('id', doctorId)
      .single()

    const { data, error } = await supabaseAdmin
      .from('appointments')
      .insert({
        patient_id: uid,
        doctor_id: doctorId,
        appointment_date: date,
        appointment_time: time,
        status: 'pending',
        consultation_type: consultationType ?? 'in_person',
        chief_complaint: chiefComplaint ?? null,
      })
      .select()
      .single()

    if (error) throw error

    const doctorName = (doctor?.profiles as any)?.full_name ?? 'your doctor'
    const patientName = patient?.full_name ?? 'A patient'

    await supabaseAdmin.from('notifications').insert([
      {
        user_id: uid,
        title: 'Appointment Requested',
        message: `Your appointment with Dr. ${doctorName} on ${date} at ${time} is pending confirmation.`,
        type: 'info',
        related_appointment_id: data.id,
      },
      {
        user_id: doctor?.profile_id,
        title: 'New Appointment Request',
        message: `${patientName} requested an appointment on ${date} at ${time}.`,
        type: 'info',
        related_appointment_id: data.id,
      },
    ])

    return NextResponse.json({ success: true, appointment: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
