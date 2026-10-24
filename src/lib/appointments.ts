import { supabaseAdmin } from './supabase-admin'
import { clinicInstant } from './clinic-time'

export type ConsultationType = 'video' | 'phone' | 'in_person'
export const CONSULTATION_TYPES: ConsultationType[] = ['video', 'phone', 'in_person']

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^\d{2}:\d{2}(:\d{2})?$/

/** "09:30:00" -> "09:30" */
const hhmm = (t: string) => t.substring(0, 5)

/**
 * Free slots ("HH:MM") for a doctor on a date, based on the weekly
 * availability template, blocked dates and existing bookings.
 */
export async function getAvailableSlots(doctorId: string, date: string): Promise<string[]> {
  if (!DATE_RE.test(date)) return []

  // JS getDay(): 0=Sun..6=Sat → schema: 0=Mon..6=Sun
  const jsDay = new Date(date + 'T00:00:00').getDay()
  const schemaDay = jsDay === 0 ? 6 : jsDay - 1

  const { data: blocked } = await supabaseAdmin
    .from('blocked_dates')
    .select('id')
    .eq('doctor_id', doctorId)
    .eq('blocked_date', date)
    .maybeSingle()
  if (blocked) return []

  const { data: avail } = await supabaseAdmin
    .from('doctor_availability')
    .select('start_time, end_time, slot_duration_minutes')
    .eq('doctor_id', doctorId)
    .eq('day_of_week', schemaDay)
    .eq('is_active', true)
    .maybeSingle()
  if (!avail) return []

  const [sh, sm] = String(avail.start_time).split(':').map(Number)
  const [eh, em] = String(avail.end_time).split(':').map(Number)
  const duration = Number(avail.slot_duration_minutes) || 30

  const all: string[] = []
  for (let t = sh * 60 + sm; t + duration <= eh * 60 + em; t += duration) {
    all.push(`${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`)
  }

  const { data: booked } = await supabaseAdmin
    .from('appointments')
    .select('appointment_time')
    .eq('doctor_id', doctorId)
    .eq('appointment_date', date)
    .in('status', ['pending', 'confirmed'])

  const taken = new Set((booked ?? []).map((a: { appointment_time: string }) => hhmm(a.appointment_time)))
  const now = new Date()
  return all.filter((s) => !taken.has(s) && clinicInstant(date, s) > now)
}

export type BookingInput = {
  patientId: string
  doctorId: string
  date: string
  time: string
  consultationType?: string
  chiefComplaint?: string | null
}

export type BookingResult =
  | { ok: true; appointment: Record<string, unknown> }
  | { ok: false; status: number; error: string }

/**
 * Create a pending appointment after validating the doctor and the slot.
 * The patient id must come from a verified token, never from the client.
 */
export async function bookAppointment(input: BookingInput): Promise<BookingResult> {
  const { patientId, doctorId, date, time } = input
  const consultationType = input.consultationType ?? 'in_person'

  if (!doctorId || !date || !time) {
    return { ok: false, status: 400, error: 'Missing required fields: doctorId, date, and time' }
  }
  if (!DATE_RE.test(date)) return { ok: false, status: 400, error: 'Invalid date format. Use YYYY-MM-DD' }
  if (!TIME_RE.test(time)) return { ok: false, status: 400, error: 'Invalid time format. Use HH:MM' }
  if (!CONSULTATION_TYPES.includes(consultationType as ConsultationType)) {
    return { ok: false, status: 400, error: 'Invalid consultation type' }
  }
  if (clinicInstant(date, hhmm(time)) < new Date()) {
    return { ok: false, status: 400, error: 'Cannot book appointments in the past' }
  }

  const { data: doctor } = await supabaseAdmin
    .from('doctor_profiles')
    .select('id, profile_id, is_verified, profiles!doctor_profiles_profile_id_fkey(full_name)')
    .eq('id', doctorId)
    .maybeSingle()

  if (!doctor || !doctor.is_verified) return { ok: false, status: 404, error: 'Doctor not found' }
  if (doctor.profile_id === patientId) {
    return { ok: false, status: 400, error: 'You cannot book an appointment with yourself' }
  }

  const slots = await getAvailableSlots(doctorId, date)
  if (!slots.includes(hhmm(time))) {
    return { ok: false, status: 409, error: 'This time slot is not available' }
  }

  const { data, error } = await supabaseAdmin
    .from('appointments')
    .insert({
      patient_id: patientId,
      doctor_id: doctorId,
      appointment_date: date,
      appointment_time: hhmm(time),
      status: 'pending',
      consultation_type: consultationType,
      chief_complaint: input.chiefComplaint ?? null,
    })
    .select()
    .single()

  if (error || !data) {
    // 23505 = unique violation: someone else booked the slot a moment earlier
    if (error?.code === '23505') return { ok: false, status: 409, error: 'This time slot was just booked' }
    return { ok: false, status: 500, error: 'Could not create appointment' }
  }

  const { data: patient } = await supabaseAdmin
    .from('profiles')
    .select('full_name')
    .eq('id', patientId)
    .maybeSingle()

  const doctorProfile = doctor.profiles as { full_name?: string } | { full_name?: string }[] | null
  const doctorName =
    (Array.isArray(doctorProfile) ? doctorProfile[0]?.full_name : doctorProfile?.full_name) ?? 'your doctor'
  const patientName = patient?.full_name ?? 'A patient'
  const when = `${date} at ${hhmm(time)}`

  const notifications = [
    {
      user_id: patientId,
      title: 'Appointment Requested',
      message: `Your appointment with Dr. ${doctorName} on ${when} is pending confirmation.`,
      type: 'info',
      related_appointment_id: data.id,
    },
  ]
  if (doctor.profile_id) {
    notifications.push({
      user_id: doctor.profile_id,
      title: 'New Appointment Request',
      message: `${patientName} requested an appointment on ${when}.`,
      type: 'info',
      related_appointment_id: data.id,
    })
  }

  const { error: notifyError } = await supabaseAdmin.from('notifications').insert(notifications)
  if (notifyError) console.error('Error creating notifications:', notifyError)

  return { ok: true, appointment: data }
}
