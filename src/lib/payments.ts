/**
 * Online payments through Razorpay (UPI, cards, netbanking, wallets).
 *
 * RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET   API keys (test keys start with rzp_test_)
 * RAZORPAY_WEBHOOK_SECRET                secret set on the webhook in the dashboard
 *
 * Flow: doctor confirms → patient creates an order → Razorpay Checkout →
 * the browser posts the signed result to /api/payments/verify, and the
 * webhook records it too in case the browser never comes back.
 */
import crypto from 'crypto'
import { supabaseAdmin } from './supabase-admin'
import { CURRENCY } from './format'

const API = 'https://api.razorpay.com/v1'

export function paymentsEnabled(): boolean {
  return !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
}

/** Video visits must be paid before joining when online payments are on. */
export function paymentRequiredToJoin(type: string): boolean {
  return paymentsEnabled() && type === 'video'
}

async function razorpay<T>(path: string, body?: object): Promise<{ ok: boolean; status: number; data: T }> {
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64')
  const res = await fetch(`${API}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15_000),
  })
  return { ok: res.ok, status: res.status, data: (await res.json().catch(() => ({}))) as T }
}

/** Fee in the smallest currency unit (paise). */
export function toMinorUnits(fee: number | string): number {
  return Math.round(Number(fee) * 100)
}

/** Fetch an existing order (to reuse it, or to notice it was already paid). */
export async function fetchOrder(orderId: string) {
  const res = await razorpay<{ id?: string; amount?: number; currency?: string; status?: string }>(`/orders/${orderId}`)
  return res.ok && res.data.id ? res.data : null
}

/** The captured payment of a paid order, if any. */
export async function fetchOrderPayment(orderId: string) {
  const res = await razorpay<{ items?: { id: string; status: string; amount: number; currency: string }[] }>(`/orders/${orderId}/payments`)
  return res.data.items?.find((p) => p.status === 'captured') ?? null
}

export async function createOrder(appointmentId: string, amount: number) {
  type Order = { id?: string; amount?: number; currency?: string; error?: { description?: string } }
  const res = await razorpay<Order>('/orders', {
    amount,
    currency: CURRENCY,
    receipt: `appt_${appointmentId.replace(/-/g, '').slice(0, 30)}`,
    notes: { appointmentId },
  })
  if (!res.ok || !res.data.id) throw new Error(res.data.error?.description ?? `Razorpay order failed (${res.status})`)
  return { id: res.data.id, amount: res.data.amount ?? amount, currency: res.data.currency ?? CURRENCY }
}

function safeEqualHex(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8')
  const bb = Buffer.from(b, 'utf8')
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb)
}

/** Checkout result signature: HMAC-SHA256(order_id + "|" + payment_id, key_secret). */
export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET
  if (!secret || !orderId || !paymentId || !signature) return false
  const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex')
  return safeEqualHex(expected, signature)
}

/** Webhook signature: HMAC-SHA256(raw body, webhook secret). */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret || !signature) return false
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  return safeEqualHex(expected, signature)
}

/**
 * Record a successful payment against the appointment that owns the order.
 * Idempotent: the checkout callback and the webhook may both arrive.
 * Returns the appointment id when this call changed it to paid.
 */
export async function markPaid(p: {
  orderId: string
  paymentId: string
  amount: number
  currency: string
  /** From the order's notes: used if the order id is no longer on the appointment */
  appointmentId?: string
}): Promise<string | null> {
  const paid = {
    payment_status: 'paid',
    razorpay_order_id: p.orderId,
    razorpay_payment_id: p.paymentId,
    amount_paid: p.amount,
    payment_currency: p.currency,
    paid_at: new Date().toISOString(),
  }
  let { data: rows } = await supabaseAdmin
    .from('appointments')
    .update(paid)
    .eq('razorpay_order_id', p.orderId)
    .eq('payment_status', 'unpaid')
    .select('id, patient_id, doctor_id, status')
  if ((!rows || rows.length === 0) && p.appointmentId) {
    ;({ data: rows } = await supabaseAdmin
      .from('appointments')
      .update(paid)
      .eq('id', p.appointmentId)
      .eq('payment_status', 'unpaid')
      .select('id, patient_id, doctor_id, status'))
  }

  const appt = rows?.[0]
  if (!appt) return null

  await supabaseAdmin.from('notifications').insert({
    user_id: appt.patient_id,
    title: 'Payment received',
    message: 'Thanks, your payment is confirmed. You’ll find the receipt in your visits.',
    type: 'success',
    related_appointment_id: appt.id,
  })
  await supabaseAdmin.from('audit_logs').insert({
    actor_id: appt.patient_id,
    action: 'payment_completed',
    target_table: 'appointments',
    target_id: appt.id,
    metadata: { razorpay_payment_id: p.paymentId, amount: p.amount, currency: p.currency },
  })

  // Paid but the visit was cancelled meanwhile: give the money back
  if (appt.status === 'cancelled') await refundIfPaid(appt.id, 'Visit was cancelled before payment completed')
  return appt.id
}

/**
 * Full refund for a paid appointment (used when a visit is cancelled).
 * Safe to call for unpaid visits: it does nothing. Never throws.
 */
export async function refundIfPaid(appointmentId: string, reason: string): Promise<'refunded' | 'pending' | 'none' | 'failed'> {
  // Claim the refund so two cancellations can't refund twice
  const { data: rows } = await supabaseAdmin
    .from('appointments')
    .update({ payment_status: 'refund_pending' })
    .eq('id', appointmentId)
    .eq('payment_status', 'paid')
    .select('id, patient_id, razorpay_payment_id, amount_paid')
  const appt = rows?.[0]
  if (!appt) return 'none'
  if (!paymentsEnabled() || !appt.razorpay_payment_id) return 'pending'

  type Refund = { id?: string; status?: string; error?: { description?: string } }
  try {
    const res = await razorpay<Refund>(`/payments/${appt.razorpay_payment_id}/refund`, {
      amount: appt.amount_paid ?? undefined,
      notes: { appointmentId, reason: reason.slice(0, 250) },
    })
    if (!res.ok || !res.data.id) throw new Error(res.data.error?.description ?? `status ${res.status}`)
    const done = res.data.status === 'processed'
    await supabaseAdmin
      .from('appointments')
      .update({ razorpay_refund_id: res.data.id, ...(done ? { payment_status: 'refunded', refunded_at: new Date().toISOString() } : {}) })
      .eq('id', appointmentId)
    await supabaseAdmin.from('notifications').insert({
      user_id: appt.patient_id,
      title: 'Refund started',
      message: 'Your payment for the cancelled visit is being refunded. Banks usually take 5–7 working days.',
      type: 'info',
      related_appointment_id: appointmentId,
    })
    return done ? 'refunded' : 'pending'
  } catch (e) {
    // Stays refund_pending (and logged) so it can be refunded from the Razorpay dashboard
    console.error('Refund failed for', appointmentId, e)
    await supabaseAdmin.from('audit_logs').insert({
      actor_id: appt.patient_id,
      action: 'refund_failed',
      target_table: 'appointments',
      target_id: appointmentId,
      metadata: { razorpay_payment_id: appt.razorpay_payment_id, error: e instanceof Error ? e.message : String(e) },
    })
    return 'failed'
  }
}

/** Webhook: a refund finished processing. */
export async function markRefunded(paymentId: string, refundId: string) {
  await supabaseAdmin
    .from('appointments')
    .update({ payment_status: 'refunded', razorpay_refund_id: refundId, refunded_at: new Date().toISOString() })
    .eq('razorpay_payment_id', paymentId)
    .in('payment_status', ['paid', 'refund_pending'])
}
