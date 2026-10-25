import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { fetchOrder, fetchOrderPayment, markPaid, verifyCheckoutSignature } from '@/lib/payments'

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

  // Amount and currency come from Razorpay, never from the browser
  // (if the lookup fails, the order's own amount is what was charged)
  const payment = await fetchOrderPayment(orderId).catch(() => null)
  const order = payment ? null : await fetchOrder(orderId).catch(() => null)
  await markPaid({
    orderId,
    paymentId,
    amount: payment?.amount ?? order?.amount ?? 0,
    currency: payment?.currency ?? order?.currency ?? '',
  })
  return NextResponse.json({ ok: true, appointmentId: appt.id })
}
