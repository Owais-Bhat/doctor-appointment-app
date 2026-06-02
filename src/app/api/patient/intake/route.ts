import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyToken, unauthorized } from '@/lib/api-auth'

export async function GET(request: Request) {
  const uid = await verifyToken(request)
  if (!uid) return unauthorized()

  const url = new URL(request.url)
  const appointmentId = url.searchParams.get('appointmentId')
  if (!appointmentId) return NextResponse.json({ error: 'appointmentId required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('appointments')
    .select(`
      id, appointment_date, appointment_time, chief_complaint, notes,
      doctor_profiles!appointments_doctor_id_fkey(
        profiles!doctor_profiles_profile_id_fkey(full_name)
      )
    `)
    .eq('id', appointmentId)
    .eq('patient_id', uid)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })

  return NextResponse.json({ appointment: data })
}

export async function PATCH(request: Request) {
  const uid = await verifyToken(request)
  if (!uid) return unauthorized()

  const { appointmentId, chief_complaint, notes } = await request.json()
  if (!appointmentId) return NextResponse.json({ error: 'appointmentId required' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('appointments')
    .update({ chief_complaint, notes, updated_at: new Date().toISOString() })
    .eq('id', appointmentId)
    .eq('patient_id', uid)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
