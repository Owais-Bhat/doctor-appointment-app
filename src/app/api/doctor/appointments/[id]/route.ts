import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireUser } from '@/lib/api-auth'

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser(request, ['doctor'])
  if (auth instanceof NextResponse) return auth
  const uid = auth.uid

  const { id } = await context.params
  const { status, notes } = await request.json()

  const { data: dp } = await supabaseAdmin
    .from('doctor_profiles')
    .select('id')
    .eq('profile_id', uid)
    .single()

  if (!dp) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })

  // Verify ownership
  const { data: appt } = await supabaseAdmin
    .from('appointments')
    .select('id, status')
    .eq('id', id)
    .eq('doctor_id', dp.id)
    .single()

  if (!appt) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })

  const allowed = ALLOWED_TRANSITIONS[appt.status] ?? []
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: `Cannot transition from ${appt.status} to ${status}` }, { status: 400 })
  }

  const updates: Record<string, string> = { status, updated_at: new Date().toISOString() }
  if (notes) updates.notes = String(notes).slice(0, 10000)

  const { data, error } = await supabaseAdmin
    .from('appointments')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabaseAdmin.from('audit_logs').insert({
    actor_id: uid,
    action: `appointment_${status}`,
    target_table: 'appointments',
    target_id: id,
    metadata: { previous_status: appt.status, new_status: status },
  })

  return NextResponse.json({ appointment: data })
}
