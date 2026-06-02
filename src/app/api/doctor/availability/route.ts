import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyToken, unauthorized } from '@/lib/api-auth'

export async function GET(request: Request) {
  const uid = await verifyToken(request)
  if (!uid) return unauthorized()

  const { data: dp } = await supabaseAdmin
    .from('doctor_profiles')
    .select('id')
    .eq('profile_id', uid)
    .single()

  if (!dp) return NextResponse.json({ availability: [], blocked_dates: [] })

  const today = new Date().toISOString().split('T')[0]

  const [{ data: avail }, { data: blocked }] = await Promise.all([
    supabaseAdmin
      .from('doctor_availability')
      .select('*')
      .eq('doctor_id', dp.id)
      .order('day_of_week'),
    supabaseAdmin
      .from('blocked_dates')
      .select('*')
      .eq('doctor_id', dp.id)
      .gte('blocked_date', today)
      .order('blocked_date'),
  ])

  return NextResponse.json({ availability: avail ?? [], blocked_dates: blocked ?? [] })
}

export async function PUT(request: Request) {
  const uid = await verifyToken(request)
  if (!uid) return unauthorized()

  const { data: dp } = await supabaseAdmin
    .from('doctor_profiles')
    .select('id')
    .eq('profile_id', uid)
    .single()

  if (!dp) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })

  const { slots } = await request.json()

  await supabaseAdmin.from('doctor_availability').delete().eq('doctor_id', dp.id)

  if (slots?.length > 0) {
    const { error } = await supabaseAdmin.from('doctor_availability').insert(
      slots.map((s: any) => ({
        doctor_id: dp.id,
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        end_time: s.end_time,
        slot_duration_minutes: s.slot_duration_minutes ?? 30,
        is_active: s.is_active ?? true,
      }))
    )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
