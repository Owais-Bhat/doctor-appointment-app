import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyToken, unauthorized } from '@/lib/api-auth'

export async function GET(request: Request) {
  const uid = await verifyToken(request)
  if (!uid) return unauthorized()

  const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', uid).single()
  if (profile?.role !== 'super_admin') return unauthorized()

  const [
    { count: totalUsers },
    { count: totalDoctors },
    { count: totalAppointments },
    { count: activePatients },
  ] = await Promise.all([
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('doctor_profiles').select('*', { count: 'exact', head: true }).eq('is_verified', true),
    supabaseAdmin.from('appointments').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'patient'),
  ])

  return NextResponse.json({
    stats: {
      total_users: totalUsers ?? 0,
      total_doctors: totalDoctors ?? 0,
      total_appointments: totalAppointments ?? 0,
      active_patients: activePatients ?? 0,
    }
  })
}
