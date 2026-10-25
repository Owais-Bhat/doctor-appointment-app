import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyToken, unauthorized } from '@/lib/api-auth'
import { refundIfPaid } from '@/lib/payments'

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const uid = await verifyToken(request)
  if (!uid) return unauthorized()

  const { id } = await context.params

  const { data: appt } = await supabaseAdmin
    .from('appointments')
    .select('id, status, appointment_date, appointment_time, doctor_id')
    .eq('id', id)
    .eq('patient_id', uid)
    .maybeSingle()

  if (!appt) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })

  if (!['pending', 'confirmed'].includes(appt.status)) {
    return NextResponse.json({ error: `Cannot cancel a ${appt.status} appointment` }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('appointments')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: 'Could not cancel appointment' }, { status: 500 })

  const refund = await refundIfPaid(id, 'Cancelled by the patient')

  // Let the doctor know the slot is free again
  const { data: doctor } = await supabaseAdmin
    .from('doctor_profiles').select('profile_id').eq('id', appt.doctor_id).maybeSingle()
  const doctorUserId = doctor?.profile_id
  if (doctorUserId) {
    const { data: patient } = await supabaseAdmin.from('profiles').select('full_name').eq('id', uid).maybeSingle()
    await supabaseAdmin.from('notifications').insert({
      user_id: doctorUserId,
      title: 'Appointment cancelled',
      message: `${patient?.full_name ?? 'A patient'} cancelled their visit on ${appt.appointment_date} at ${String(appt.appointment_time).substring(0, 5)}.`,
      type: 'warning',
      related_appointment_id: id,
    })
  }

  await supabaseAdmin.from('audit_logs').insert({
    actor_id: uid,
    action: 'appointment_cancelled',
    target_table: 'appointments',
    target_id: id,
    metadata: { cancelled_by: 'patient', previous_status: appt.status },
  })

  return NextResponse.json({ ok: true, refund })
}
