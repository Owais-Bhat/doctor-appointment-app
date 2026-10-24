import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireUser } from '@/lib/api-auth'

const SCOPES = ['today', 'requests', 'upcoming', 'past'] as const
type Scope = (typeof SCOPES)[number]

/**
 * GET /api/doctor/appointments?scope=today|requests|upcoming|past
 *
 * - today:    every appointment today, by time
 * - requests: pending appointments from today on, soonest first
 * - upcoming: confirmed appointments from today on, soonest first
 * - past:     earlier appointments plus completed/cancelled ones, newest first (max 100)
 *
 * `counts` (requests, today) is always included for badges.
 */
export async function GET(request: Request) {
  const auth = await requireUser(request, ['doctor'])
  if (auth instanceof NextResponse) return auth

  const scope = (new URL(request.url).searchParams.get('scope') ?? 'upcoming') as Scope
  if (!SCOPES.includes(scope)) {
    return NextResponse.json({ error: `scope must be one of ${SCOPES.join(', ')}` }, { status: 400 })
  }

  const { data: dp } = await supabaseAdmin
    .from('doctor_profiles')
    .select('id')
    .eq('profile_id', auth.uid)
    .maybeSingle()

  if (!dp) return NextResponse.json({ appointments: [], counts: { requests: 0, today: 0 } })

  const today = new Date().toISOString().split('T')[0]

  let query = supabaseAdmin
    .from('appointments')
    .select(`
      id, appointment_date, appointment_time, status, consultation_type,
      chief_complaint, notes, created_at,
      profiles!appointments_patient_id_fkey ( id, full_name, phone, date_of_birth, blood_type )
    `)
    .eq('doctor_id', dp.id)

  if (scope === 'today') {
    query = query.eq('appointment_date', today).order('appointment_time', { ascending: true })
  } else if (scope === 'requests') {
    query = query.eq('status', 'pending').gte('appointment_date', today)
      .order('appointment_date', { ascending: true }).order('appointment_time', { ascending: true })
  } else if (scope === 'upcoming') {
    query = query.eq('status', 'confirmed').gte('appointment_date', today)
      .order('appointment_date', { ascending: true }).order('appointment_time', { ascending: true })
  } else {
    query = query.or(`appointment_date.lt.${today},status.in.(completed,cancelled,no_show)`)
      .order('appointment_date', { ascending: false }).order('appointment_time', { ascending: false })
      .limit(100)
  }

  const [{ data, error }, { count: requests }, { count: todayCount }] = await Promise.all([
    query,
    supabaseAdmin.from('appointments').select('id', { count: 'exact', head: true })
      .eq('doctor_id', dp.id).eq('status', 'pending').gte('appointment_date', today),
    supabaseAdmin.from('appointments').select('id', { count: 'exact', head: true })
      .eq('doctor_id', dp.id).eq('appointment_date', today).in('status', ['pending', 'confirmed', 'completed']),
  ])

  if (error) {
    console.error('Doctor appointments error:', error)
    return NextResponse.json({ error: 'Could not load appointments' }, { status: 500 })
  }

  return NextResponse.json({
    appointments: data ?? [],
    counts: { requests: requests ?? 0, today: todayCount ?? 0 },
  })
}
