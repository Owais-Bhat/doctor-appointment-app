import { supabaseAdmin } from './supabase-admin'
import { addDays, clinicInstant, clinicToday } from './clinic-time'
import { configuredChannel, sendMessage, toE164 } from './messaging'

type Kind = '24h' | '1h'
type Row = {
  id: string
  appointment_date: string
  appointment_time: string
  consultation_type: string
  patient_id: string
  doctor_id: string
  reminder_24h_sent_at: string | null
  reminder_1h_sent_at: string | null
}

export type ReminderSummary = {
  checked: number
  reminded: { id: string; kind: Kind; texted: boolean }[]
  failures: { id: string; error: string }[]
  channel: string
}

const COLUMN: Record<Kind, 'reminder_24h_sent_at' | 'reminder_1h_sent_at'> = {
  '24h': 'reminder_24h_sent_at',
  '1h': 'reminder_1h_sent_at',
}

/**
 * Which reminder (if any) is due now. Runs every ~15 minutes, so the
 * windows overlap the schedule and a missed run is caught by the next one.
 * - 1h:  the visit starts within 75 minutes
 * - 24h: the visit starts within ~24 hours (and more than 75 minutes away);
 *        visits booked at short notice still get one reminder
 */
export function dueReminder(minutesUntil: number, row: Pick<Row, 'reminder_24h_sent_at' | 'reminder_1h_sent_at'>): Kind | null {
  if (minutesUntil <= 0) return null
  if (minutesUntil <= 75) return row.reminder_1h_sent_at ? null : '1h'
  if (minutesUntil <= 24 * 60 + 15) return row.reminder_24h_sent_at ? null : '24h'
  return null
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

function dayWords(date: string, now: Date) {
  const today = clinicToday(now)
  if (date === today) return 'today'
  if (date === addDays(today, 1)) return 'tomorrow'
  const [y, m, d] = date.split('-').map(Number)
  return `on ${new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })}`
}

const VISIT = { video: 'video visit', phone: 'phone call', in_person: 'visit' } as Record<string, string>

export function reminderText(kind: Kind, p: { doctor: string; date: string; time: string; type: string; now: Date; appUrl?: string }) {
  const visit = VISIT[p.type] ?? 'visit'
  const when = kind === '1h' ? `at ${formatTime(p.time)} (in about an hour)` : `${dayWords(p.date, p.now)} at ${formatTime(p.time)}`
  const link = p.appUrl ? ` ${p.type === 'video' ? 'Join' : 'Details'}: ${p.appUrl}/client/appointments` : ''
  return {
    title: kind === '1h' ? 'Your visit starts soon' : 'Visit reminder',
    message: `Your ${visit} with ${p.doctor} is ${when}.`,
    text: `MedFlow: your ${visit} with ${p.doctor} is ${when}.${link}`,
  }
}

/** Send every reminder that is due. Safe to run concurrently or repeatedly. */
export async function runReminders(now = new Date()): Promise<ReminderSummary> {
  const channel = configuredChannel()
  const today = clinicToday(now)
  const summary: ReminderSummary = { checked: 0, reminded: [], failures: [], channel: channel ?? 'in-app only' }

  const { data, error } = await supabaseAdmin
    .from('appointments')
    .select('id, appointment_date, appointment_time, consultation_type, patient_id, doctor_id, reminder_24h_sent_at, reminder_1h_sent_at')
    .eq('status', 'confirmed')
    .in('appointment_date', [today, addDays(today, 1), addDays(today, 2)])
  if (error) throw new Error(`Could not load appointments: ${error.message}`)

  const rows = (data ?? []) as Row[]
  summary.checked = rows.length
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')

  for (const row of rows) {
    const minutes = (clinicInstant(row.appointment_date, row.appointment_time).getTime() - now.getTime()) / 60000
    const kind = dueReminder(minutes, row)
    if (!kind) continue

    // Claim it: only the run that flips the column from null sends the reminder.
    // A 1h reminder also marks the 24h one, so a late booking gets one message.
    const stamp = now.toISOString()
    const claim: Record<string, string> = { [COLUMN[kind]]: stamp }
    if (kind === '1h' && !row.reminder_24h_sent_at) claim.reminder_24h_sent_at = stamp
    const { data: claimed } = await supabaseAdmin
      .from('appointments')
      .update(claim)
      .eq('id', row.id)
      .eq('status', 'confirmed')
      .is(COLUMN[kind], null)
      .select('id')
    if (!claimed || claimed.length === 0) continue

    const [{ data: patient }, { data: doctor }] = await Promise.all([
      supabaseAdmin.from('profiles').select('full_name, phone, reminders_enabled').eq('id', row.patient_id).maybeSingle(),
      supabaseAdmin.from('doctor_profiles').select('profile_id').eq('id', row.doctor_id).maybeSingle(),
    ])
    const { data: doctorProfile } = doctor?.profile_id
      ? await supabaseAdmin.from('profiles').select('full_name').eq('id', doctor.profile_id).maybeSingle()
      : { data: null }
    const rawName = doctorProfile?.full_name?.trim()
    const doctorName = !rawName ? 'your doctor' : /^dr\.?\s/i.test(rawName) ? rawName : `Dr. ${rawName}`

    const msg = reminderText(kind, {
      doctor: doctorName,
      date: row.appointment_date,
      time: row.appointment_time,
      type: row.consultation_type,
      now,
      appUrl,
    })

    await supabaseAdmin.from('notifications').insert({
      user_id: row.patient_id,
      title: msg.title,
      message: msg.message,
      type: 'reminder',
      related_appointment_id: row.id,
    })

    let texted = false
    const phone = toE164(patient?.phone)
    if (channel && phone && patient?.reminders_enabled !== false) {
      const sent = await sendMessage(channel, phone, msg.text)
      if (sent.ok) texted = true
      else summary.failures.push({ id: row.id, error: sent.error })
    }
    summary.reminded.push({ id: row.id, kind, texted })
  }

  return summary
}
