import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getStripe } from '@/lib/stripe'


export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  const stripe = getStripe()
  if (!stripe || !webhookSecret || !sig) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    return NextResponse.json({ error: `Webhook error: ${err instanceof Error ? err.message : 'invalid signature'}` }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { appointmentId, patientId } = session.metadata ?? {}

    if (appointmentId && patientId && session.payment_status === 'paid') {
      // Only confirm appointments still waiting for payment, so a cancelled
      // appointment is never brought back by a late webhook.
      const { data: updated } = await supabaseAdmin
        .from('appointments')
        .update({ status: 'confirmed', updated_at: new Date().toISOString() })
        .eq('id', appointmentId)
        .eq('patient_id', patientId)
        .eq('status', 'pending')
        .select('id')

      if (!updated || updated.length === 0) {
        return NextResponse.json({ received: true, skipped: 'appointment not pending' })
      }

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
