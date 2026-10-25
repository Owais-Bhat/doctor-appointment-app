import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyToken, unauthorized } from '@/lib/api-auth'
import { getStripe } from '@/lib/stripe'


export async function POST(request: Request) {
  const uid = await verifyToken(request)
  if (!uid) return unauthorized()

  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json({ error: 'Payments not configured' }, { status: 503 })
  }

  try {
    const { appointmentId } = await request.json()
    if (!appointmentId) return NextResponse.json({ error: 'appointmentId required' }, { status: 400 })

    const { data: appt } = await supabaseAdmin
      .from('appointments')
      .select(`
        id, appointment_date, appointment_time, status, patient_id,
        doctor_profiles!appointments_doctor_id_fkey (
          consultation_fee,
          profiles!doctor_profiles_profile_id_fkey (full_name)
        )
      `)
      .eq('id', appointmentId)
      .eq('patient_id', uid)
      .single()

    if (!appt) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    if (appt.status !== 'pending') {
      return NextResponse.json({ error: 'Appointment is not pending payment' }, { status: 400 })
    }

    const doctor = appt.doctor_profiles as unknown as { consultation_fee?: number; profiles?: { full_name?: string } } | null
    const fee = Math.round(Number(doctor?.consultation_fee ?? 100) * 100) // cents
    const doctorName = doctor?.profiles?.full_name ?? 'Your doctor'

    // Never build redirect URLs from a client-controlled header
    const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Consultation with Dr. ${doctorName}`,
            description: `${appt.appointment_date} at ${appt.appointment_time.substring(0, 5)}`,
          },
          unit_amount: fee,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${origin}/client/appointments?payment=success`,
      cancel_url: `${origin}/client/appointments?payment=cancelled`,
      metadata: {
        appointmentId,
        patientId: uid,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: 'Could not start checkout' }, { status: 500 })
  }
}
