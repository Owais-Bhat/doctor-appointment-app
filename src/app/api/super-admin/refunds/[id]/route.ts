import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/api-auth'
import { retryRefund } from '@/lib/payments'
import { supabaseAdmin } from '@/lib/supabase-admin'

const MESSAGE = {
  refunded: 'The refund went through.',
  pending: 'The refund was started. Banks take 5–7 working days. If it stays here, refund it from the Razorpay dashboard.',
  manual: 'The app cannot send this refund (no Razorpay connection or payment id). Refund it from the Razorpay dashboard.',
  failed: 'Razorpay did not accept the refund. Refund it from the Razorpay dashboard.',
  not_retryable: 'This payment is not waiting for a refund.',
} as const

/** POST /api/super-admin/refunds/:id — try a stuck refund again. */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(request, ['super_admin'])
  if (auth instanceof NextResponse) return auth
  const { id } = await context.params

  const result = await retryRefund(id)
  if (result !== 'not_retryable') {
    await supabaseAdmin.from('audit_logs').insert({ actor_id: auth.uid, action: 'refund_retried', target_table: 'appointments', target_id: id, metadata: { result } })
  }
  return NextResponse.json({ result, message: MESSAGE[result] }, { status: result === 'not_retryable' ? 409 : 200 })
}
