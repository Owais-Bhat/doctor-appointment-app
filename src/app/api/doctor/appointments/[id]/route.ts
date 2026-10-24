import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireUser } from '@/lib/api-auth'
import { clinicToday } from '@/lib/clinic-time'

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled', 'no_show'],
  completed: [],
  cancelled: [],
  no_show: [],
}

/** What the patient is told when the doctor changes a visit. */
const PATIENT_MESSAGE: Record<string, { title: string; type: string; text: (doctor: string, when: string) => string }> = {
  confirmed: {
    title: 'Appointment confirmed',
    type: 'success',
    text: (doctor, when) => `${doctor} confirmed your visit on ${when}.`,
  },
  cancelled: {
    title: 'Appointment declined',
    type: 'warning',
    text: (doctor, when) => `${doctor} can’t see you on ${when}. Please book another time.`,
  },
  completed: {
    title: 'How was your visit?',
    type: 'reminder',
    text: (doctor) => `Your visit with ${doctor} is complete. You can now rate it.`,
  },
}

/**
 * PATCH /api/doctor/appointments/:id
 * Body: { status?, notes? }
 * - Change status (confirm, decline, complete, no-show) following ALLOWED_TRANSITIONS
 * - Or send only `notes` to update visit notes without changing status
 */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser(request, ['doctor'])
  if (auth instanceof NextResponse) return auth
  const uid = auth.uid

  const { id } = await context.params
  let body: { status?: string; notes?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const { status, notes } = body

  const { data: dp } = await supabaseAdmin
    .from('doctor_profiles')
    .select('id')
    .eq('profile_id', uid)
    .maybeSingle()

  if (!dp) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })

  // Ownership: the appointment must belong to this doctor
  const { data: appt } = await supabaseAdmin
    .from('appointments')
    .select('id, status, patient_id, appointment_date, appointment_time')
    .eq('id', id)
    .eq('doctor_id', dp.id)
    .maybeSingle()

  if (!appt) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })

  const changingStatus = !!status && status !== appt.status
  if (!changingStatus && notes === undefined) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  if (changingStatus) {
    const allowed = ALLOWED_TRANSITIONS[appt.status] ?? []
    if (!allowed.includes(status)) {
      return NextResponse.json({ error: `A ${appt.status} visit can’t be marked ${status}` }, { status: 400 })
    }
    const today = clinicToday()
    if ((status === 'completed' || status === 'no_show') && appt.appointment_date > today) {
      return NextResponse.json({ error: 'A visit can only be completed on or after its date' }, { status: 400 })
    }
  }

  const updates: Record<string, string> = { updated_at: new Date().toISOString() }
  if (changingStatus) updates.status = status
  if (notes !== undefined) updates.notes = String(notes).slice(0, 10000)

  const { data, error } = await supabaseAdmin
    .from('appointments')
    .update(updates)
    .eq('id', id)
    .eq('status', appt.status) // ignore if someone else changed it meanwhile
    .select()
    .maybeSingle()

  if (error) return NextResponse.json({ error: 'Could not update appointment' }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'This visit was just changed. Refresh and try again.' }, { status: 409 })

  if (changingStatus) {
    const message = PATIENT_MESSAGE[status]
    if (message && appt.patient_id) {
      const { data: me } = await supabaseAdmin.from('profiles').select('full_name').eq('id', uid).maybeSingle()
      const raw = me?.full_name?.trim()
      const doctor = !raw ? 'Your doctor' : /^dr\.?\s/i.test(raw) ? raw : `Dr. ${raw}`
      const when = `${appt.appointment_date} at ${String(appt.appointment_time).substring(0, 5)}`
      const { error: notifyError } = await supabaseAdmin.from('notifications').insert({
        user_id: appt.patient_id,
        title: message.title,
        message: message.text(doctor, when),
        type: message.type,
        related_appointment_id: id,
      })
      if (notifyError) console.error('Notify patient failed:', notifyError)
    }

    await supabaseAdmin.from('audit_logs').insert({
      actor_id: uid,
      action: `appointment_${status}`,
      target_table: 'appointments',
      target_id: id,
      metadata: { previous_status: appt.status, new_status: status },
    })
  }

  return NextResponse.json({ appointment: data })
}
