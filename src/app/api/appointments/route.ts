import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/api-auth'
import { bookAppointment } from '@/lib/appointments'

export async function POST(request: Request) {
  const auth = await requireUser(request, ['patient'])
  if (auth instanceof NextResponse) return auth

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
