import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireUser } from '@/lib/api-auth'

export async function POST(request: Request) {
  const auth = await requireUser(request, ['doctor'])
  if (auth instanceof NextResponse) return auth
  const uid = auth.uid

  const { data: dp } = await supabaseAdmin
    .from('doctor_profiles')
    .select('id')
    .eq('profile_id', uid)
    .single()

  if (!dp) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })

  const { date, reason } = await request.json()
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Pick a valid date' }, { status: 400 })
  }
  if (date < new Date().toISOString().split('T')[0]) {
    return NextResponse.json({ error: 'That date has already passed' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('blocked_dates')
    .insert({ doctor_id: dp.id, blocked_date: date, reason: reason ? String(reason).slice(0, 120) : null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Could not add the day off' }, { status: 500 })
  return NextResponse.json({ blocked_date: data })
}
