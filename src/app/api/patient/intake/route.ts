import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireUser } from '@/lib/api-auth'
import { clinicToday } from '@/lib/clinic-time'

const SEVERITIES = ['mild', 'moderate', 'severe'] as const

/** GET /api/patient/intake?appointmentId=… — the visit plus what the patient already told us. */
export async function GET(request: Request) {
  const auth = await requireUser(request, ['patient'])
  if (auth instanceof NextResponse) return auth
  const uid = auth.uid

  const appointmentId = new URL(request.url).searchParams.get('appointmentId')
  if (!appointmentId) return NextResponse.json({ error: 'appointmentId required' }, { status: 400 })

  const { data: appt } = await supabaseAdmin
    .from('appointments')
    .select('id, appointment_date, appointment_time, status, consultation_type, chief_complaint, intake, doctor_id')
    .eq('id', appointmentId)
    .eq('patient_id', uid)
    .maybeSingle()
  if (!appt) return NextResponse.json({ error: 'Visit not found' }, { status: 404 })

  // Direct lookups (no embedded relations) so this also works on the local db.json store
  const { data: dp } = await supabaseAdmin.from('doctor_profiles').select('profile_id, specialty').eq('id', appt.doctor_id).maybeSingle()
  const [{ data: doc }, { data: me }] = await Promise.all([
    dp ? supabaseAdmin.from('profiles').select('full_name').eq('id', dp.profile_id).maybeSingle() : Promise.resolve({ data: null }),
    supabaseAdmin.from('profiles').select('health_stats').eq('id', uid).maybeSingle(),
  ])

  const { doctor_id: _d, ...visit } = appt
  void _d
  return NextResponse.json({
    appointment: { ...visit, doctor: { name: doc?.full_name ?? null, specialty: dp?.specialty ?? null } },
    // To prefill medicines and allergies the first time
    health: { allergies: me?.health_stats?.allergies ?? null, medications: me?.health_stats?.medications ?? null },
    editable: ['pending', 'confirmed'].includes(appt.status) && appt.appointment_date >= clinicToday(),
  })
}

function text(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim().slice(0, max)
  return t || null
}

/**
 * PATCH /api/patient/intake
 * { appointmentId, chief_complaint, duration?, severity?, medications?, allergies?, saveToProfile? }
 * Only for the patient's own upcoming visits. Never touches the doctor's notes.
 */
export async function PATCH(request: Request) {
  const auth = await requireUser(request, ['patient'])
  if (auth instanceof NextResponse) return auth
  const uid = auth.uid

  const body = await request.json().catch(() => ({}))
  const appointmentId = typeof body.appointmentId === 'string' ? body.appointmentId : ''
  if (!appointmentId) return NextResponse.json({ error: 'appointmentId required' }, { status: 400 })

  const reason = text(body.chief_complaint, 1000)
  if (!reason) return NextResponse.json({ error: 'Tell the doctor why you’re visiting' }, { status: 400 })
  const severity = typeof body.severity === 'string' && (SEVERITIES as readonly string[]).includes(body.severity) ? body.severity : null

  const { data: appt } = await supabaseAdmin
    .from('appointments')
    .select('id, status, appointment_date')
    .eq('id', appointmentId)
    .eq('patient_id', uid)
    .maybeSingle()
  if (!appt) return NextResponse.json({ error: 'Visit not found' }, { status: 404 })
  if (!['pending', 'confirmed'].includes(appt.status) || appt.appointment_date < clinicToday()) {
    return NextResponse.json({ error: 'This visit can’t be changed any more' }, { status: 409 })
  }

  const intake = {
    duration: text(body.duration, 60),
    severity,
    medications: text(body.medications, 300),
    allergies: text(body.allergies, 300),
    updated_at: new Date().toISOString(),
  }
  const { error } = await supabaseAdmin
    .from('appointments')
    .update({ chief_complaint: reason, intake, updated_at: new Date().toISOString() })
    .eq('id', appointmentId)
    .eq('patient_id', uid)
  if (error) return NextResponse.json({ error: 'Couldn’t save your details' }, { status: 500 })

  // Keep the health profile in step so the next visit is prefilled
  if (body.saveToProfile === true && (intake.medications || intake.allergies)) {
    const { data: me } = await supabaseAdmin.from('profiles').select('health_stats').eq('id', uid).maybeSingle()
    const hs = { ...(me?.health_stats ?? {}) }
    if (intake.medications) hs.medications = intake.medications
    if (intake.allergies) hs.allergies = intake.allergies
    await supabaseAdmin.from('profiles').update({ health_stats: hs }).eq('id', uid)
  }

  return NextResponse.json({ ok: true })
}
