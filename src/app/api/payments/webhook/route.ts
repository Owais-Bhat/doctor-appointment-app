import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase-admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2026-05-27.dahlia',
})

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret || !sig) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { appointmentId, patientId } = session.metadata ?? {}

    if (appointmentId && patientId) {
      await supabaseAdmin
        .from('appointments')
        .update({ status: 'confirmed', updated_at: new Date().toISOString() })
        .eq('id', appointmentId)
        .eq('patient_id', patientId)

      await supabaseAdmin.from('notifications').insert({
        user_id: patientId,
        title: 'Payment confirmed',
        message: 'Your appointment has been confirmed after successful payment.',
        type: 'success',
        related_appointment_id: appointmentId,
      })

      await supabaseAdmin.from('audit_logs').insert({
        actor_id: patientId,
        action: 'payment_completed',
        target_table: 'appointments',
        target_id: appointmentId,
        metadata: { stripe_session_id: session.id, amount: session.amount_total },
      })
    }
  }

  return NextResponse.json({ received: true })
}
