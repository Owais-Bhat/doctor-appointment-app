import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: doctorId } = await context.params
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')

  if (!date) return NextResponse.json({ error: 'date required' }, { status: 400 })

  // JS getDay(): 0=Sun..6=Sat → schema: 0=Mon..6=Sun
  const jsDay = new Date(date + 'T00:00:00').getDay()
  const schemaDay = jsDay === 0 ? 6 : jsDay - 1

  // Check if date is blocked
  const { data: blocked } = await supabaseAdmin
    .from('blocked_dates')
    .select('id')
    .eq('doctor_id', doctorId)
    .eq('blocked_date', date)
    .maybeSingle()

  if (blocked) return NextResponse.json({ slots: [] })

  // Get availability template for this day
  const { data: avail } = await supabaseAdmin
    .from('doctor_availability')
    .select('start_time, end_time, slot_duration_minutes')
    .eq('doctor_id', doctorId)
    .eq('day_of_week', schemaDay)
    .eq('is_active', true)
    .maybeSingle()

  if (!avail) return NextResponse.json({ slots: [] })

  // Generate all possible slots
  const [sh, sm] = avail.start_time.split(':').map(Number)
  const [eh, em] = avail.end_time.split(':').map(Number)
  const startMins = sh * 60 + sm
  const endMins = eh * 60 + em
  const duration = avail.slot_duration_minutes ?? 30

  const allSlots: string[] = []
  for (let t = startMins; t + duration <= endMins; t += duration) {
    const h = Math.floor(t / 60).toString().padStart(2, '0')
    const m = (t % 60).toString().padStart(2, '0')
    allSlots.push(`${h}:${m}`)
  }

  // Remove already-booked slots
  const { data: booked } = await supabaseAdmin
    .from('appointments')
    .select('appointment_time')
    .eq('doctor_id', doctorId)
    .eq('appointment_date', date)
    .in('status', ['pending', 'confirmed'])

  const bookedTimes = new Set(
    (booked ?? []).map((a: any) => a.appointment_time.substring(0, 5))
  )

  return NextResponse.json({ slots: allSlots.filter(s => !bookedTimes.has(s)) })
}
