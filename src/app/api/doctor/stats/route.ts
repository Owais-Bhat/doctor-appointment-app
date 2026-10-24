import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireUser } from '@/lib/api-auth'
import { clinicMonthStart, clinicToday } from '@/lib/clinic-time'

export async function GET(request: Request) {
  const auth = await requireUser(request, ['doctor'])
  if (auth instanceof NextResponse) return auth
  const uid = auth.uid

  const { data: doctorProfile } = await supabaseAdmin
    .from('doctor_profiles')
    .select('id, rating, total_reviews, consultation_fee')
    .eq('profile_id', uid)
    .single()

  if (!doctorProfile) return NextResponse.json({ stats: null })

  const today = clinicToday()
  const firstOfMonth = clinicMonthStart()

  const [{ count: todayCount }, { count: monthlyCompleted }, { data: patientRows }] = await Promise.all([
    supabaseAdmin.from('appointments').select('*', { count: 'exact', head: true })
      .eq('doctor_id', doctorProfile.id).eq('appointment_date', today),
    supabaseAdmin.from('appointments').select('*', { count: 'exact', head: true })
      .eq('doctor_id', doctorProfile.id).eq('status', 'completed')
      .gte('appointment_date', firstOfMonth),
    supabaseAdmin.from('appointments').select('patient_id')
      .eq('doctor_id', doctorProfile.id).in('status', ['confirmed', 'completed']),
  ])

  const revenueMtd = (monthlyCompleted ?? 0) * Number(doctorProfile.consultation_fee)

  return NextResponse.json({
    stats: {
      today_count: todayCount ?? 0,
      rating: doctorProfile.rating ?? 0,
      total_reviews: doctorProfile.total_reviews ?? 0,
      revenue_mtd: revenueMtd,
      // distinct patients seen or booked (not appointment count)
      total_patients: new Set((patientRows ?? []).map((r: { patient_id: string }) => r.patient_id)).size,
    }
  })
}
