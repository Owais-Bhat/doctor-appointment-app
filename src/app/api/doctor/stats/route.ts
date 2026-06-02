import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyToken, unauthorized } from '@/lib/api-auth'

export async function GET(request: Request) {
  const uid = await verifyToken(request)
  if (!uid) return unauthorized()

  const { data: doctorProfile } = await supabaseAdmin
    .from('doctor_profiles')
    .select('id, rating, total_reviews, consultation_fee')
    .eq('profile_id', uid)
    .single()

  if (!doctorProfile) return NextResponse.json({ stats: null })

  const today = new Date().toISOString().split('T')[0]
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

  const [{ count: todayCount }, { count: monthlyCompleted }, { count: totalPatients }] = await Promise.all([
    supabaseAdmin.from('appointments').select('*', { count: 'exact', head: true })
      .eq('doctor_id', doctorProfile.id).eq('appointment_date', today),
    supabaseAdmin.from('appointments').select('*', { count: 'exact', head: true })
      .eq('doctor_id', doctorProfile.id).eq('status', 'completed')
      .gte('appointment_date', firstOfMonth),
    supabaseAdmin.from('appointments').select('patient_id', { count: 'exact', head: true })
      .eq('doctor_id', doctorProfile.id),
  ])

  const revenueMtd = (monthlyCompleted ?? 0) * Number(doctorProfile.consultation_fee)

  return NextResponse.json({
    stats: {
      today_count: todayCount ?? 0,
      rating: doctorProfile.rating ?? 0,
      total_reviews: doctorProfile.total_reviews ?? 0,
      revenue_mtd: revenueMtd,
      total_patients: totalPatients ?? 0,
    }
  })
}
