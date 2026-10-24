import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { joinState, loadVisitFor } from '@/lib/visit-access'
import { joinVisit } from '@/lib/video-provider'

const REASON: Record<string, string> = {
  not_video: 'This visit is not a video visit',
  not_confirmed: 'This visit is not confirmed',
  too_early: 'The video room is not open yet',
  ended: 'This visit has ended',
}

/** POST /api/visits/:id/join — a room link for this visit's patient or doctor only. */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(request, ['patient', 'doctor'])
  if (auth instanceof NextResponse) return auth
  const { id } = await context.params

  const found = await loadVisitFor(id, auth.uid)
  if (!found) return NextResponse.json({ error: 'Visit not found' }, { status: 404 })

  const state = joinState(found.visit, found.role)
  if (!state.ok) return NextResponse.json({ error: REASON[state.reason], reason: state.reason, opensAt: state.opensAt }, { status: 409 })

  const { data: me } = await supabaseAdmin.from('profiles').select('full_name').eq('id', auth.uid).maybeSingle()
  const raw = me?.full_name?.trim() || (found.role === 'doctor' ? 'Doctor' : 'Patient')
  const name = found.role === 'doctor' && !/^dr\.?\s/i.test(raw) ? `Dr. ${raw}` : raw

  try {
    const info = await joinVisit(found.visit, { name, isDoctor: found.role === 'doctor' })
    return NextResponse.json(info)
  } catch (e) {
    console.error('Video join failed:', e)
    return NextResponse.json({ error: 'The video room could not be opened. Try again in a moment.' }, { status: 502 })
  }
}
