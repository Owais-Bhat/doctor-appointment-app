import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyToken, unauthorized } from '@/lib/api-auth'

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const uid = await verifyToken(request)
  if (!uid) return unauthorized()

  const { id } = await context.params

  const { data: appt } = await supabaseAdmin
    .from('appointments')
    .select('id, status')
    .eq('id', id)
    .eq('patient_id', uid)
    .single()

  if (!appt) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })

  if (appt.status === 'completed' || appt.status === 'cancelled') {
    return NextResponse.json({ error: `Cannot cancel a ${appt.status} appointment` }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('appointments')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabaseAdmin.from('audit_logs').insert({
    actor_id: uid,
    action: 'appointment_cancelled',
    target_table: 'appointments',
    target_id: id,
    metadata: { cancelled_by: 'patient', previous_status: appt.status },
  })

  return NextResponse.json({ ok: true })
}
