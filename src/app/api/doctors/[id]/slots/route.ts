import { NextResponse } from 'next/server'
import { getAvailableSlots } from '@/lib/appointments'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: doctorId } = await context.params
  const date = new URL(request.url).searchParams.get('date')

  if (!date) return NextResponse.json({ error: 'date required' }, { status: 400 })

  return NextResponse.json({ slots: await getAvailableSlots(doctorId, date) })
}
