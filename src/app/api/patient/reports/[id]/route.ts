import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

/** PATCH /api/patient/reports/:id  { appointmentId: string | null } — share with a visit's doctor, or stop sharing. */
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(request, ['patient'])
  if (auth instanceof NextResponse) return auth
  const { id } = await context.params
  const body = await request.json().catch(() => ({}))
  if (!('appointmentId' in body)) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

  let appointmentId: string | null = null
  if (body.appointmentId) {
    appointmentId = String(body.appointmentId)
    const { data: appt } = await supabaseAdmin.from('appointments').select('id, status').eq('id', appointmentId).eq('patient_id', auth.uid).maybeSingle()
    if (!appt || appt.status === 'cancelled') return NextResponse.json({ error: 'Visit not found' }, { status: 404 })
  }
  const { data, error } = await supabaseAdmin
    .from('medical_reports')
    .update({ appointment_id: appointmentId })
    .eq('id', id)
    .eq('patient_id', auth.uid)
    .select('id, title, mime_type, size_bytes, appointment_id, created_at')
  if (error) return NextResponse.json({ error: 'Could not update the report' }, { status: 500 })
  if (!data?.length) return NextResponse.json({ error: 'Report not found' }, { status: 404 })
  return NextResponse.json({ report: data[0] })
}

/** DELETE /api/patient/reports/:id */
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(request, ['patient'])
  if (auth instanceof NextResponse) return auth
  const { id } = await context.params
  const { error } = await supabaseAdmin.from('medical_reports').delete().eq('id', id).eq('patient_id', auth.uid)
  if (error) return NextResponse.json({ error: 'Could not delete the report' }, { status: 500 })
  return NextResponse.json({ success: true })
}
