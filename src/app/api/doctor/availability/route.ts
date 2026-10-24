import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireUser } from '@/lib/api-auth'
import { clinicToday } from '@/lib/clinic-time'

export async function GET(request: Request) {
  const auth = await requireUser(request, ['doctor'])
  if (auth instanceof NextResponse) return auth
  const uid = auth.uid

  const { data: dp } = await supabaseAdmin
    .from('doctor_profiles')
    .select('id')
    .eq('profile_id', uid)
    .single()

  if (!dp) return NextResponse.json({ availability: [], blocked_dates: [] })

  const today = clinicToday()

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
  const auth = await requireUser(request, ['doctor'])
  if (auth instanceof NextResponse) return auth
  const uid = auth.uid

  const { data: dp } = await supabaseAdmin
    .from('doctor_profiles')
    .select('id')
    .eq('profile_id', uid)
    .single()

  if (!dp) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })

  const { slots } = await request.json()

  type SlotInput = {
    day_of_week: number
    start_time: string
    end_time: string
    slot_duration_minutes?: number
    is_active?: boolean
  }
  const TIME = /^\d{2}:\d{2}(:\d{2})?$/
  const list: SlotInput[] = Array.isArray(slots) ? slots : []
  const invalid = list.find((s) =>
    !Number.isInteger(s?.day_of_week) || s.day_of_week < 0 || s.day_of_week > 6 ||
    !TIME.test(String(s.start_time)) || !TIME.test(String(s.end_time)) ||
    String(s.start_time) >= String(s.end_time) ||
    (s.slot_duration_minutes !== undefined && (Number(s.slot_duration_minutes) < 5 || Number(s.slot_duration_minutes) > 240))
  )
  if (invalid) return NextResponse.json({ error: 'Invalid availability slot' }, { status: 400 })

  await supabaseAdmin.from('doctor_availability').delete().eq('doctor_id', dp.id)

  if (list.length > 0) {
    const { error } = await supabaseAdmin.from('doctor_availability').insert(
      list.map((s) => ({
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
