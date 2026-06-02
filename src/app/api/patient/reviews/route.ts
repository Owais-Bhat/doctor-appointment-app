import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyToken, unauthorized } from '@/lib/api-auth'

export async function POST(request: Request) {
  const uid = await verifyToken(request)
  if (!uid) return unauthorized()

  const { appointmentId, rating, comment } = await request.json()

  if (!appointmentId || !rating) {
    return NextResponse.json({ error: 'appointmentId and rating required' }, { status: 400 })
  }
  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
  }

  const { data: appt } = await supabaseAdmin
    .from('appointments')
    .select('id, status, doctor_id')
    .eq('id', appointmentId)
    .eq('patient_id', uid)
    .single()

  if (!appt) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
  if (appt.status !== 'completed') {
    return NextResponse.json({ error: 'Can only review completed appointments' }, { status: 400 })
  }

  const { data: existing } = await supabaseAdmin
    .from('reviews')
    .select('id')
    .eq('appointment_id', appointmentId)
    .single()

  if (existing) return NextResponse.json({ error: 'Already reviewed this appointment' }, { status: 409 })

  const { error } = await supabaseAdmin.from('reviews').insert({
    appointment_id: appointmentId,
    patient_id: uid,
    doctor_id: appt.doctor_id,
    rating,
    comment: comment ?? null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update doctor's average rating
  const { data: reviews } = await supabaseAdmin
    .from('reviews')
    .select('rating')
    .eq('doctor_id', appt.doctor_id)

  if (reviews && reviews.length > 0) {
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    await supabaseAdmin
      .from('doctor_profiles')
      .update({ rating: Math.round(avg * 100) / 100, total_reviews: reviews.length })
      .eq('id', appt.doctor_id)
  }

  return NextResponse.json({ ok: true })
}
