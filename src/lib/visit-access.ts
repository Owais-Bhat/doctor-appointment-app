import { supabaseAdmin } from './supabase-admin'
import { clinicInstant } from './clinic-time'

export type VisitRole = 'patient' | 'doctor'
export type VisitRecord = {
  id: string
  appointment_date: string
  appointment_time: string
  status: string
  consultation_type: string
  chief_complaint: string | null
  notes: string | null
  patient_id: string
  doctor_id: string
}

/**
 * Load a visit only if `uid` is its patient or its doctor.
 * Anyone else gets null (callers answer 404, not 403, so ids can't be probed).
 */
export async function loadVisitFor(id: string, uid: string): Promise<{ visit: VisitRecord; role: VisitRole } | null> {
  const { data: visit } = await supabaseAdmin
    .from('appointments')
    .select('id, appointment_date, appointment_time, status, consultation_type, chief_complaint, notes, patient_id, doctor_id')
    .eq('id', id)
    .maybeSingle()
  if (!visit) return null
  if (visit.patient_id === uid) return { visit, role: 'patient' }

  const { data: doctor } = await supabaseAdmin
    .from('doctor_profiles')
    .select('id')
    .eq('id', visit.doctor_id)
    .eq('profile_id', uid)
    .maybeSingle()
  return doctor ? { visit, role: 'doctor' } : null
}

/**
 * When the video room is open: patients from 15 minutes before the start,
 * doctors from 60 minutes before, both until the end of that day.
 */
export function joinWindow(visit: Pick<VisitRecord, 'appointment_date' | 'appointment_time'>, role: VisitRole) {
  const start = clinicInstant(visit.appointment_date, String(visit.appointment_time).substring(0, 5))
  const opensAt = new Date(start.getTime() - (role === 'doctor' ? 60 : 15) * 60_000)
  const closesAt = clinicInstant(visit.appointment_date, '23:59')
  return { start, opensAt, closesAt }
}

export function joinState(visit: VisitRecord, role: VisitRole, now = new Date()):
  | { ok: true }
  | { ok: false; reason: 'not_video' | 'not_confirmed' | 'too_early' | 'ended'; opensAt?: string } {
  if (visit.consultation_type !== 'video') return { ok: false, reason: 'not_video' }
  if (visit.status !== 'confirmed') return { ok: false, reason: 'not_confirmed' }
  const { opensAt, closesAt } = joinWindow(visit, role)
  if (now < opensAt) return { ok: false, reason: 'too_early', opensAt: opensAt.toISOString() }
  if (now > closesAt) return { ok: false, reason: 'ended' }
  return { ok: true }
}
