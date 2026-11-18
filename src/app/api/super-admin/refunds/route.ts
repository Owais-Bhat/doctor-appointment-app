import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

type Row = Record<string, unknown>
const one = (v: unknown): Row | null => (Array.isArray(v) ? ((v[0] as Row) ?? null) : ((v as Row) ?? null))

/**
 * GET /api/super-admin/refunds — visits whose payment is being, or has been, refunded.
 * `stuck` ones are refund_pending with no Razorpay refund id: the automatic refund did not go through.
 */
export async function GET(request: Request) {
  const auth = await requireUser(request, ['super_admin'])
  if (auth instanceof NextResponse) return auth

  const { data, error } = await supabaseAdmin
    .from('appointments')
    .select(`
      id, appointment_date, appointment_time, payment_status, amount_paid, razorpay_payment_id, razorpay_refund_id, refunded_at, updated_at,
      profiles!appointments_patient_id_fkey ( full_name ),
      doctor_profiles!appointments_doctor_id_fkey ( profiles!doctor_profiles_profile_id_fkey ( full_name ) )
    `)
    .in('payment_status', ['refund_pending', 'refunded'])
    .order('updated_at', { ascending: false })
    .limit(100)
  if (error) return NextResponse.json({ error: 'Could not load refunds' }, { status: 500 })

  const refunds = ((data ?? []) as Row[]).map((a) => ({
    id: a.id,
    date: a.appointment_date,
    time: String(a.appointment_time ?? '').substring(0, 5),
    patient: one(a.profiles)?.full_name ?? null,
    doctor: one(one(a.doctor_profiles)?.profiles)?.full_name ?? null,
    amount: typeof a.amount_paid === 'number' ? a.amount_paid / 100 : null,
    status: a.payment_status,
    refund_id: a.razorpay_refund_id ?? null,
    refunded_at: a.refunded_at ?? null,
    stuck: a.payment_status === 'refund_pending' && !a.razorpay_refund_id,
  }))
  return NextResponse.json({ refunds, stuck: refunds.filter((r) => r.stuck).length })
}
