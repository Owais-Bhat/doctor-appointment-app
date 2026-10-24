import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { joinState, loadVisitFor } from '@/lib/visit-access'
import { videoProvider } from '@/lib/video-provider'

/** GET /api/visits/:id — the visit as seen by its patient or doctor. */
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(request, ['patient', 'doctor'])
  if (auth instanceof NextResponse) return auth
  const { id } = await context.params

  const found = await loadVisitFor(id, auth.uid)
  if (!found) return NextResponse.json({ error: 'Visit not found' }, { status: 404 })
  const { visit, role } = found

  const [{ data: doctorRow }, { data: patient }] = await Promise.all([
    supabaseAdmin.from('doctor_profiles').select('profile_id, specialty').eq('id', visit.doctor_id).maybeSingle(),
    supabaseAdmin
      .from('profiles')
      .select(role === 'doctor' ? 'full_name, date_of_birth, blood_type, phone, health_stats' : 'full_name')
      .eq('id', visit.patient_id)
      .maybeSingle(),
  ])
  const { data: doctorProfile } = doctorRow?.profile_id
    ? await supabaseAdmin.from('profiles').select('full_name').eq('id', doctorRow.profile_id).maybeSingle()
    : { data: null }

  return NextResponse.json({
    role,
    provider: videoProvider(),
    join: joinState(visit, role),
    visit: {
      id: visit.id,
      date: visit.appointment_date,
      time: String(visit.appointment_time).substring(0, 5),
      status: visit.status,
      type: visit.consultation_type,
      reason: visit.chief_complaint,
      // visit notes are the doctor's working notes
      notes: role === 'doctor' ? visit.notes : undefined,
    },
    doctor: { name: doctorProfile?.full_name ?? 'Your doctor', specialty: doctorRow?.specialty ?? null },
    patient,
  })
}
