import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireUser } from '@/lib/api-auth'
import { clinicInstant, clinicMonthStart } from '@/lib/clinic-time'

export async function GET(request: Request) {
  const auth = await requireUser(request, ['super_admin'])
  if (auth instanceof NextResponse) return auth

  const monthStartDate = clinicMonthStart()
  const monthStart = clinicInstant(monthStartDate, '00:00')

  const count = (q: PromiseLike<{ count: number | null }>) => Promise.resolve(q).then((r) => r.count ?? 0)

  const [totalUsers, verifiedDoctors, pendingDoctors, totalAppointments, monthAppointments, newUsers, suspended] =
    await Promise.all([
      count(supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true })),
      count(supabaseAdmin.from('doctor_profiles').select('id', { count: 'exact', head: true }).eq('is_verified', true)),
      count(supabaseAdmin.from('doctor_profiles').select('id', { count: 'exact', head: true }).eq('is_verified', false)),
      count(supabaseAdmin.from('appointments').select('id', { count: 'exact', head: true })),
      count(supabaseAdmin.from('appointments').select('id', { count: 'exact', head: true }).gte('appointment_date', monthStartDate)),
      count(supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', monthStart.toISOString())),
      count(supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }).eq('is_active', false)),
    ])

  return NextResponse.json({
    stats: {
      total_users: totalUsers,
      new_users_this_month: newUsers,
      suspended_users: suspended,
      verified_doctors: verifiedDoctors,
      pending_doctors: pendingDoctors,
      total_appointments: totalAppointments,
      appointments_this_month: monthAppointments,
      // kept for older clients
      total_doctors: verifiedDoctors,
    },
  })
}
