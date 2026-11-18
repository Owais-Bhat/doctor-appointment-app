import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireUser } from '@/lib/api-auth'
import { refundIfPaid } from '@/lib/payments'
import { clinicToday } from '@/lib/clinic-time'
import { notify, type Notice } from '@/lib/notify'
import { cleanFollowUp, cleanPrescription } from '@/lib/prescription'

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled', 'no_show'],
  completed: [],
  cancelled: [],
  no_show: [],
}

/** What the patient is told when the doctor changes a visit. */
const PATIENT_MESSAGE: Record<string, { title: string; type: Notice['type']; text: (doctor: string, when: string) => string }> = {
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
 * Body: { status?, notes?, prescription?, followUpDate? }
 * - Change status (confirm, decline, complete, no-show) following ALLOWED_TRANSITIONS
 * - Or send only `notes` to update visit notes without changing status
 * - `prescription` ({ items, advice }, or null to clear) and `followUpDate` (YYYY-MM-DD or null)
 *   can be saved on a confirmed or completed visit
 */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser(request, ['doctor'])
  if (auth instanceof NextResponse) return auth
  const uid = auth.uid

  const { id } = await context.params
  let body: { status?: string; notes?: string; prescription?: unknown; followUpDate?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const { status, notes } = body
  const hasRx = body.prescription !== undefined
  const hasFollowUp = body.followUpDate !== undefined

  const { data: dp } = await supabaseAdmin
    .from('doctor_profiles')
    .select('id')
    .eq('profile_id', uid)
    .maybeSingle()

  if (!dp) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })

  // Ownership: the appointment must belong to this doctor
  const { data: appt } = await supabaseAdmin
    .from('appointments')
    .select('id, status, patient_id, appointment_date, appointment_time, prescription')
    .eq('id', id)
    .eq('doctor_id', dp.id)
    .maybeSingle()

  if (!appt) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })

  const changingStatus = !!status && status !== appt.status
  if (!changingStatus && notes === undefined && !hasRx && !hasFollowUp) {
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

  // A prescription belongs to a visit that is happening or happened, not one still awaiting an answer
  if ((hasRx || hasFollowUp) && !['confirmed', 'completed'].includes(changingStatus ? status! : appt.status)) {
    return NextResponse.json({ error: 'Confirm the visit before writing a prescription' }, { status: 400 })
  }
  let followUp: string | null | undefined
  if (hasFollowUp) {
    followUp = body.followUpDate === null || body.followUpDate === '' ? null : cleanFollowUp(body.followUpDate)
    if (followUp === null && body.followUpDate) return NextResponse.json({ error: 'Follow-up date must look like 2026-12-31' }, { status: 400 })
  }

  const updates: Record<string, string | null> = { updated_at: new Date().toISOString() }
  if (changingStatus) updates.status = status!
  if (notes !== undefined) updates.notes = String(notes).slice(0, 10000)
  const rx = hasRx ? cleanPrescription(body.prescription) : undefined
  if (hasRx) updates.prescription = rx ? JSON.stringify(rx) : null
  if (hasFollowUp) updates.follow_up_date = followUp ?? null

  const { data, error } = await supabaseAdmin
    .from('appointments')
    .update(updates)
    .eq('id', id)
    .eq('status', appt.status) // ignore if someone else changed it meanwhile
    .select()
    .maybeSingle()

  if (error) return NextResponse.json({ error: 'Could not update appointment' }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'This visit was just changed. Refresh and try again.' }, { status: 409 })

  // First prescription on this visit: tell the patient it is ready
  if (rx && !appt.prescription && appt.patient_id) {
    const { data: me } = await supabaseAdmin.from('profiles').select('full_name').eq('id', uid).maybeSingle()
    const raw = me?.full_name?.trim()
    const doctor = !raw ? 'Your doctor' : /^dr\.?\s/i.test(raw) ? raw : `Dr. ${raw}`
    const { error: rxNotifyError } = await notify({
      user_id: appt.patient_id,
      title: 'Prescription ready',
      message: `${doctor} added a prescription for your visit on ${appt.appointment_date}. Open My visits to see it.`,
      type: 'info',
      related_appointment_id: id,
    })
    if (rxNotifyError) console.error('Notify prescription failed:', rxNotifyError)
  }

  if (changingStatus) {
    const message = PATIENT_MESSAGE[status!]
    if (message && appt.patient_id) {
      const { data: me } = await supabaseAdmin.from('profiles').select('full_name').eq('id', uid).maybeSingle()
      const raw = me?.full_name?.trim()
      const doctor = !raw ? 'Your doctor' : /^dr\.?\s/i.test(raw) ? raw : `Dr. ${raw}`
      const when = `${appt.appointment_date} at ${String(appt.appointment_time).substring(0, 5)}`
      const { error: notifyError } = await notify({
        user_id: appt.patient_id,
        title: message.title,
        message: message.text(doctor, when),
        type: message.type,
        related_appointment_id: id,
      })
      if (notifyError) console.error('Notify patient failed:', notifyError)
    }

    if (status === 'cancelled') await refundIfPaid(id, 'Cancelled by the doctor')

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
