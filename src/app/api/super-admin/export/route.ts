import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/api-auth'
import { toCsv } from '@/lib/csv'
import { supabaseAdmin } from '@/lib/supabase-admin'

const TYPES = ['users', 'visits', 'payments'] as const
type ExportType = (typeof TYPES)[number]
const LIMIT = 10_000

type Row = Record<string, unknown>
const one = (v: unknown): Row | null => (Array.isArray(v) ? ((v[0] as Row) ?? null) : ((v as Row) ?? null))
const rupees = (paise: unknown) => (typeof paise === 'number' ? (paise / 100).toFixed(2) : '')

/**
 * GET /api/super-admin/export?type=users|visits|payments — a CSV download for the admin.
 * Exports are recorded in the audit log, because they contain personal data.
 */
export async function GET(request: Request) {
  const auth = await requireUser(request, ['super_admin'])
  if (auth instanceof NextResponse) return auth

  const type = new URL(request.url).searchParams.get('type') as ExportType | null
  if (!type || !TYPES.includes(type)) return NextResponse.json({ error: `type must be one of: ${TYPES.join(', ')}` }, { status: 400 })

  let csv: string
  if (type === 'users') {
    const { data, error } = await supabaseAdmin.from('profiles').select('full_name, email, phone, role, is_active, created_at').order('created_at', { ascending: false }).limit(LIMIT)
    if (error) return NextResponse.json({ error: 'Could not export' }, { status: 500 })
    csv = toCsv(['Name', 'Email', 'Phone', 'Role', 'Active', 'Joined'], (data ?? []).map((u: Row) => [u.full_name, u.email, u.phone, u.role, u.is_active === false ? 'no' : 'yes', u.created_at]))
  } else {
    const { data, error } = await supabaseAdmin
      .from('appointments')
      .select(`
        appointment_date, appointment_time, status, consultation_type, payment_status, amount_paid, razorpay_payment_id, paid_at, refunded_at,
        profiles!appointments_patient_id_fkey ( full_name ),
        doctor_profiles!appointments_doctor_id_fkey ( specialty, profiles!doctor_profiles_profile_id_fkey ( full_name ) )
      `)
      .order('appointment_date', { ascending: false })
      .limit(LIMIT)
    if (error) return NextResponse.json({ error: 'Could not export' }, { status: 500 })
    const rows = (data ?? []) as Row[]
    const patient = (a: Row) => one(a.profiles)?.full_name
    const doctor = (a: Row) => one(one(a.doctor_profiles)?.profiles)?.full_name
    const specialty = (a: Row) => one(a.doctor_profiles)?.specialty
    if (type === 'visits') {
      csv = toCsv(
        ['Date', 'Time', 'Status', 'Type', 'Patient', 'Doctor', 'Specialty', 'Payment'],
        rows.map((a) => [a.appointment_date, String(a.appointment_time ?? '').substring(0, 5), a.status, a.consultation_type, patient(a), doctor(a), specialty(a), a.payment_status]),
      )
    } else {
      csv = toCsv(
        ['Visit date', 'Patient', 'Doctor', 'Amount (INR)', 'Payment status', 'Razorpay payment id', 'Paid at', 'Refunded at'],
        rows.filter((a) => a.payment_status && a.payment_status !== 'unpaid').map((a) => [a.appointment_date, patient(a), doctor(a), rupees(a.amount_paid), a.payment_status, a.razorpay_payment_id, a.paid_at, a.refunded_at]),
      )
    }
  }

  await supabaseAdmin.from('audit_logs').insert({ actor_id: auth.uid, action: 'data_export', target_table: type, metadata: { type } })

  const day = new Date().toISOString().slice(0, 10)
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="medflow-${type}-${day}.csv"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
