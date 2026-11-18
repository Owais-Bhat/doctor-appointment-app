import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/api-auth'
import { rescheduleAppointment } from '@/lib/appointments'
import { RateLimitPresets, checkRateLimitByUser } from '@/lib/middleware/rateLimiter'

/** POST /api/patient/appointments/:id/reschedule  { date: "YYYY-MM-DD", time: "HH:MM" } */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(request, ['patient'])
  if (auth instanceof NextResponse) return auth

  const limit = checkRateLimitByUser(`reschedule:${auth.uid}`, RateLimitPresets.appointmentBooking)
  if (!limit.success) return NextResponse.json({ error: 'Too many attempts. Please wait a minute.' }, { status: 429 })

  const { id } = await context.params
  const body = await request.json().catch(() => ({}))
  const result = await rescheduleAppointment({ patientId: auth.uid, id, date: String(body?.date ?? ''), time: String(body?.time ?? '') })

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })
  return NextResponse.json({ success: true, appointment: result.appointment })
}
