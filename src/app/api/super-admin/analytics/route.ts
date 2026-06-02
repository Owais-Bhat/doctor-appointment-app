import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyToken, unauthorized } from '@/lib/api-auth'

function getLast6Months() {
  const months: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    months.push(d.toISOString().substring(0, 7))
  }
  return months
}

function shortMonthLabel(ym: string) {
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleString('default', { month: 'short' })
}

export async function GET(request: Request) {
  const uid = await verifyToken(request)
  if (!uid) return unauthorized()

  const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', uid).single()
  if (profile?.role !== 'super_admin') return unauthorized()

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  const startDate = sixMonthsAgo.toISOString().split('T')[0]

  const [
    { data: appointments },
    { data: users },
    { data: doctors },
  ] = await Promise.all([
    supabaseAdmin
      .from('appointments')
      .select('id, appointment_date, status, doctor_id')
      .gte('appointment_date', startDate),
    supabaseAdmin
      .from('profiles')
      .select('id, created_at, role')
      .gte('created_at', sixMonthsAgo.toISOString()),
    supabaseAdmin
      .from('doctor_profiles')
      .select('id, consultation_fee, specialty, is_verified'),
  ])

  const appts = appointments ?? []
  const usrs = users ?? []
  const docs = doctors ?? []
  const months = getLast6Months()

  // Appointments by month
  const apptMap: Record<string, { month: string; appointments: number; revenue: number }> = {}
  for (const m of months) apptMap[m] = { month: shortMonthLabel(m), appointments: 0, revenue: 0 }

  const feeMap: Record<string, number> = {}
  for (const d of docs) feeMap[d.id] = Number(d.consultation_fee) || 0

  for (const a of appts) {
    const m = a.appointment_date.substring(0, 7)
    if (apptMap[m]) {
      apptMap[m].appointments++
      if (a.status === 'completed') apptMap[m].revenue += feeMap[a.doctor_id] || 0
    }
  }

  // New users by month
  const userMap: Record<string, { month: string; users: number }> = {}
  for (const m of months) userMap[m] = { month: shortMonthLabel(m), users: 0 }
  for (const u of usrs) {
    const m = u.created_at.substring(0, 7)
    if (userMap[m]) userMap[m].users++
  }

  // Specialty distribution
  const specialtyMap: Record<string, number> = {}
  for (const d of docs) {
    specialtyMap[d.specialty] = (specialtyMap[d.specialty] || 0) + 1
  }
  const specialties = Object.entries(specialtyMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)

  const totalRevenue = appts
    .filter(a => a.status === 'completed')
    .reduce((sum, a) => sum + (feeMap[a.doctor_id] || 0), 0)

  const statusDist = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 } as Record<string, number>
  for (const a of appts) {
    if (statusDist[a.status] !== undefined) statusDist[a.status]++
  }

  return NextResponse.json({
    monthly: Object.values(apptMap),
    userGrowth: Object.values(userMap),
    specialties,
    stats: {
      totalRevenue,
      totalAppointments: appts.length,
      completedAppointments: appts.filter(a => a.status === 'completed').length,
      verifiedDoctors: docs.filter(d => d.is_verified).length,
      newUsersThisMonth: usrs.filter(u => u.created_at.substring(0, 7) === months[months.length - 1]).length,
    },
    statusBreakdown: Object.entries(statusDist).map(([status, count]) => ({ status, count })),
  })
}
