import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireUser } from '@/lib/api-auth'

export async function POST(request: Request) {
  // requireUser also refuses suspended accounts
  const auth = await requireUser(request)
  if (auth instanceof NextResponse) return auth
  const uid = auth.uid

  const body = await request.json().catch(() => ({}))
  const appointmentId = typeof body.appointmentId === 'string' ? body.appointmentId : ''
  const rating = body.rating
  // Free text shown to others: plain string with a length cap
  const comment = typeof body.comment === 'string' ? body.comment.trim().slice(0, 1000) || null : null

  if (!appointmentId || !rating) {
    return NextResponse.json({ error: 'appointmentId and rating required' }, { status: 400 })
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
  }

  const { data: appt } = await supabaseAdmin
    .from('appointments')
    .select('id, status, doctor_id')
    .eq('id', appointmentId)
    .eq('patient_id', uid)
    .maybeSingle()

  if (!appt) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
  if (appt.status !== 'completed') {
    return NextResponse.json({ error: 'Can only review completed appointments' }, { status: 400 })
  }

  const { data: existing } = await supabaseAdmin
    .from('reviews')
    .select('id')
    .eq('appointment_id', appointmentId)
    .maybeSingle()

  if (existing) return NextResponse.json({ error: 'Already reviewed this appointment' }, { status: 409 })

  const { error } = await supabaseAdmin.from('reviews').insert({
    appointment_id: appointmentId,
    patient_id: uid,
    doctor_id: appt.doctor_id,
    rating,
    comment,
  })

  if (error) {
    // 23505 = unique violation: two submissions at once
    if (error.code === '23505') return NextResponse.json({ error: 'Already reviewed this appointment' }, { status: 409 })
    console.error('Review insert failed:', error)
    return NextResponse.json({ error: 'Could not save your review' }, { status: 500 })
  }

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
