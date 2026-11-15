import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/api-auth'
import { bookAppointment } from '@/lib/appointments'
import { RateLimitPresets, checkRateLimitByUser } from '@/lib/middleware/rateLimiter'

export async function POST(request: Request) {
  const auth = await requireUser(request, ['patient'])
  if (auth instanceof NextResponse) return auth

  // Stops one account from flooding doctors with requests and holding every slot
  const limit = checkRateLimitByUser(`book:${auth.uid}`, RateLimitPresets.appointmentBooking)
  if (!limit.success) {
    return NextResponse.json({ error: 'Too many booking attempts. Please wait a minute.' }, { status: 429 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const result = await bookAppointment({
    patientId: auth.uid,
    doctorId: String(body.doctorId ?? ''),
    date: String(body.date ?? ''),
    time: String(body.time ?? ''),
    consultationType: body.consultationType ? String(body.consultationType) : undefined,
    chiefComplaint: body.chiefComplaint ? String(body.chiefComplaint).slice(0, 2000) : null,
  })

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })
  return NextResponse.json({ success: true, appointment: result.appointment })
}
