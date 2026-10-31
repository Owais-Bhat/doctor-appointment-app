import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { fetchOrderPayment, markPaid, verifyCheckoutSignature } from '@/lib/payments'

/**
 * POST /api/payments/verify
 * { razorpay_order_id, razorpay_payment_id, razorpay_signature } from Checkout.
 * The signature proves Razorpay produced this result for our order.
 */
export async function POST(request: Request) {
  const auth = await requireUser(request, ['patient'])
  if (auth instanceof NextResponse) return auth

  const body = await request.json().catch(() => ({}))
  const orderId = String(body.razorpay_order_id ?? '')
  const paymentId = String(body.razorpay_payment_id ?? '')
  const signature = String(body.razorpay_signature ?? '')

  if (!verifyCheckoutSignature(orderId, paymentId, signature)) {
    return NextResponse.json({ error: 'Payment could not be verified' }, { status: 400 })
  }

  const { data: appt } = await supabaseAdmin
    .from('appointments')
    .select('id, payment_status')
    .eq('razorpay_order_id', orderId)
    .eq('patient_id', auth.uid)
    .maybeSingle()
  if (!appt) return NextResponse.json({ error: 'Visit not found' }, { status: 404 })
  if (appt.payment_status !== 'unpaid') return NextResponse.json({ ok: true, appointmentId: appt.id })

  // A signed checkout response identifies the payment, but the captured
  // transaction must be confirmed with Razorpay before marking a visit paid.
  const payment = await fetchOrderPayment(orderId, paymentId).catch(() => null)
  if (payment?.id !== paymentId || !payment.amount || !payment.currency) {
    return NextResponse.json({ error: 'Payment is still being confirmed. Please try again shortly.' }, { status: 409 })
  }
  await markPaid({
    orderId,
    paymentId,
    amount: payment.amount,
    currency: payment.currency,
  })
  return NextResponse.json({ ok: true, appointmentId: appt.id })
}
