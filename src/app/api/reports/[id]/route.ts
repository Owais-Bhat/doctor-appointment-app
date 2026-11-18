import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/api-auth'
import { fileResponse } from '@/lib/files'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * GET /api/reports/:id — the file itself.
 * Allowed for the patient who uploaded it, and for the doctor of the visit it
 * is attached to. Anyone else gets 404, so ids cannot be probed.
 */
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(request, ['patient', 'doctor'])
  if (auth instanceof NextResponse) return auth
  const { id } = await context.params

  const { data: report } = await supabaseAdmin
    .from('medical_reports')
    .select('id, patient_id, appointment_id, mime_type, file_name, data')
    .eq('id', id)
    .maybeSingle()
  if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 })

  let allowed = report.patient_id === auth.uid
  if (!allowed && auth.role === 'doctor' && report.appointment_id) {
    const [{ data: appt }, { data: doctor }] = await Promise.all([
      supabaseAdmin.from('appointments').select('doctor_id, status').eq('id', report.appointment_id).maybeSingle(),
      supabaseAdmin.from('doctor_profiles').select('id').eq('profile_id', auth.uid).maybeSingle(),
    ])
    allowed = !!appt && !!doctor && appt.doctor_id === doctor.id && appt.status !== 'cancelled'
  }
  if (!allowed) return NextResponse.json({ error: 'Report not found' }, { status: 404 })

  return fileResponse(report.data, report.mime_type, report.file_name)
}
