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

  const { data: dp } = await supabaseAdmin
    .from('doctor_profiles')
    .select('id, consultation_fee, rating, total_reviews')
    .eq('profile_id', uid)
    .single()

  if (!dp) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  const startDate = sixMonthsAgo.toISOString().split('T')[0]

  const { data: appointments } = await supabaseAdmin
    .from('appointments')
    .select('id, appointment_date, status, patient_id')
    .eq('doctor_id', dp.id)
    .gte('appointment_date', startDate)

  const appts = appointments ?? []
  const fee = Number(dp.consultation_fee) || 0
  const months = getLast6Months()

  const monthMap: Record<string, { month: string; visits: number; revenue: number }> = {}
  for (const m of months) {
    monthMap[m] = { month: shortMonthLabel(m), visits: 0, revenue: 0 }
  }
  for (const a of appts) {
    const m = a.appointment_date.substring(0, 7)
    if (monthMap[m]) {
      monthMap[m].visits++
      if (a.status === 'completed') monthMap[m].revenue += fee
    }
  }

  const statusBreakdown = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 } as Record<string, number>
  for (const a of appts) {
    if (statusBreakdown[a.status] !== undefined) statusBreakdown[a.status]++
  }

  const completedCount = appts.filter(a => a.status === 'completed').length
  const uniquePatients = new Set(appts.map(a => a.patient_id)).size

  return NextResponse.json({
    monthly: Object.values(monthMap),
    stats: {
      totalVisits: appts.length,
      totalRevenue: completedCount * fee,
      uniquePatients,
      rating: Number(dp.rating) || 0,
      totalReviews: dp.total_reviews || 0,
      completedVisits: completedCount,
    },
    statusBreakdown: Object.entries(statusBreakdown).map(([status, count]) => ({ status, count })),
  })
}
