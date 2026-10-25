import { NextResponse } from 'next/server'
import { markPaid, markRefunded, verifyWebhookSignature } from '@/lib/payments'

type Event = {
  event: string
  payload: {
    payment?: { entity: { id: string; order_id: string; amount: number; currency: string; status: string; notes?: Record<string, string> } }
    order?: { entity: { id: string; notes?: Record<string, string> } }
    refund?: { entity: { id: string; payment_id: string; status: string } }
  }
}

/**
 * Razorpay webhook (Dashboard → Webhooks): subscribe to order.paid,
 * payment.captured and refund.processed. Records payments even when the
 * patient closes the browser before returning to MedFlow.
 */
export async function POST(request: Request) {
  const raw = await request.text()
  if (!verifyWebhookSignature(raw, request.headers.get('x-razorpay-signature'))) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  let event: Event
  try {
    event = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  try {
    if (event.event === 'order.paid' || event.event === 'payment.captured') {
      const pay = event.payload.payment?.entity
      if (pay?.order_id && pay.status === 'captured') {
        await markPaid({
          orderId: pay.order_id,
          paymentId: pay.id,
          amount: pay.amount,
          currency: pay.currency,
          appointmentId: event.payload.order?.entity.notes?.appointmentId ?? pay.notes?.appointmentId,
        })
      }
    } else if (event.event === 'refund.processed') {
      const refund = event.payload.refund?.entity
      if (refund) await markRefunded(refund.payment_id, refund.id)
    }
  } catch (e) {
    console.error('Razorpay webhook error:', e)
    // 500 makes Razorpay retry later
    return NextResponse.json({ error: 'Webhook handling failed' }, { status: 500 })
  }
  return NextResponse.json({ received: true })
}
