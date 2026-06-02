import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyToken, unauthorized } from '@/lib/api-auth'

export async function POST(request: Request) {
  const uid = await verifyToken(request)
  if (!uid) return unauthorized()

  try {
    const body = await request.json()
    const { doctorId, date, time, consultationType, chiefComplaint } = body

    if (!doctorId || !date || !time) {
      return NextResponse.json({ error: 'Missing required fields: doctorId, date, and time' }, { status: 400 })
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 })
    }

    // Validate time format (HH:MM or HH:MM:SS)
    if (!/^\d{2}:\d{2}(:\d{2})?$/.test(time)) {
      return NextResponse.json({ error: 'Invalid time format. Use HH:MM' }, { status: 400 })
    }

    // Validate consultation type
    const validTypes = ['video', 'phone', 'in_person']
    if (consultationType && !validTypes.includes(consultationType)) {
      return NextResponse.json({ error: 'Invalid consultation type' }, { status: 400 })
    }

    // Ensure date is not in the past
    const appointmentDate = new Date(date + 'T' + time)
    if (appointmentDate < new Date()) {
      return NextResponse.json({ error: 'Cannot book appointments in the past' }, { status: 400 })
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

    // Safely extract doctor and patient names with null checks
    const doctorProfile = doctor?.profiles
    const doctorName = typeof doctorProfile === 'object' && doctorProfile !== null && 'full_name' in doctorProfile
      ? (doctorProfile as { full_name: string }).full_name
      : 'your doctor'
    const patientName = patient?.full_name ?? 'A patient'
    const doctorUserId = doctor?.profile_id

    // Only create notifications if user IDs are valid
    const notificationsToInsert = [
      {
        user_id: uid,
        title: 'Appointment Requested',
        message: `Your appointment with Dr. ${doctorName} on ${date} at ${time} is pending confirmation.`,
        type: 'info',
        related_appointment_id: data.id,
      },
    ]

    if (doctorUserId) {
      notificationsToInsert.push({
        user_id: doctorUserId,
        title: 'New Appointment Request',
        message: `${patientName} requested an appointment on ${date} at ${time}.`,
        type: 'info',
        related_appointment_id: data.id,
      })
    }

    await supabaseAdmin.from('notifications').insert(notificationsToInsert).catch(err => {
      console.error('Error creating notifications:', err)
    })

    return NextResponse.json({ success: true, appointment: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
