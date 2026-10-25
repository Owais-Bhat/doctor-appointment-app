import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { createOrder, fetchOrder, fetchOrderPayment, markPaid, paymentsEnabled, toMinorUnits } from '@/lib/payments'

/**
 * POST /api/payments/order  { appointmentId }
 * Razorpay order for the patient's own confirmed, unpaid visit.
 * Reuses the visit's open order so retries don't create duplicate orders.
 */
export async function POST(request: Request) {
  const auth = await requireUser(request, ['patient'])
  if (auth instanceof NextResponse) return auth
  if (!paymentsEnabled()) return NextResponse.json({ error: 'Online payment isn’t available yet. You can pay at the clinic.' }, { status: 503 })

  const { appointmentId } = await request.json().catch(() => ({}))
  if (!appointmentId) return NextResponse.json({ error: 'appointmentId required' }, { status: 400 })

  const { data: appt } = await supabaseAdmin
    .from('appointments')
    .select('id, status, payment_status, razorpay_order_id, doctor_id, patient_id')
    .eq('id', appointmentId)
    .eq('patient_id', auth.uid)
    .maybeSingle()
  if (!appt) return NextResponse.json({ error: 'Visit not found' }, { status: 404 })
  if (appt.payment_status !== 'unpaid') return NextResponse.json({ error: 'This visit is already paid' }, { status: 409 })
  if (appt.status !== 'confirmed') {
    return NextResponse.json({ error: 'You can pay once the doctor confirms your visit' }, { status: 409 })
  }

  const { data: doctor } = await supabaseAdmin
    .from('doctor_profiles').select('consultation_fee, profile_id').eq('id', appt.doctor_id).maybeSingle()
  const amount = toMinorUnits(doctor?.consultation_fee ?? 0)
  if (amount < 100) return NextResponse.json({ error: 'This visit has no fee to pay online' }, { status: 409 })

  try {
    // An earlier order for the same amount can be retried; a paid one is recorded now
    if (appt.razorpay_order_id) {
      const existing = await fetchOrder(appt.razorpay_order_id)
      if (existing?.status === 'paid') {
        const pay = await fetchOrderPayment(appt.razorpay_order_id)
        if (pay) await markPaid({ orderId: appt.razorpay_order_id, paymentId: pay.id, amount: pay.amount, currency: pay.currency })
        return NextResponse.json({ error: 'This visit is already paid' }, { status: 409 })
      }
      if (existing && existing.amount === amount) {
        return NextResponse.json(await checkoutInfo(auth.uid, existing.id!, amount, existing.currency!, doctor?.profile_id))
      }
    }

    const order = await createOrder(appt.id, amount)
    const { error } = await supabaseAdmin
      .from('appointments')
      .update({ razorpay_order_id: order.id })
      .eq('id', appt.id)
      .eq('payment_status', 'unpaid')
    if (error) throw error
    return NextResponse.json(await checkoutInfo(auth.uid, order.id, order.amount, order.currency, doctor?.profile_id))
  } catch (e) {
    console.error('Create order failed:', e)
    return NextResponse.json({ error: 'Payment couldn’t be started. Try again in a moment.' }, { status: 502 })
  }
}

async function checkoutInfo(uid: string, orderId: string, amount: number, currency: string, doctorProfileId?: string) {
  const [{ data: me }, { data: doc }] = await Promise.all([
    supabaseAdmin.from('profiles').select('full_name, email, phone').eq('id', uid).maybeSingle(),
    doctorProfileId
      ? supabaseAdmin.from('profiles').select('full_name').eq('id', doctorProfileId).maybeSingle()
      : Promise.resolve({ data: null as { full_name?: string } | null }),
  ])
  const raw = doc?.full_name?.trim()
  return {
    keyId: process.env.RAZORPAY_KEY_ID,
    orderId,
    amount,
    currency,
    description: raw ? `Consultation with ${/^dr\.?\s/i.test(raw) ? raw : `Dr. ${raw}`}` : 'Consultation',
    prefill: { name: me?.full_name ?? '', email: me?.email ?? '', contact: me?.phone ?? '' },
  }
}
