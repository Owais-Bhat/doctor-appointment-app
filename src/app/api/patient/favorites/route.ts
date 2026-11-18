import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

const MAX_FAVORITES = 50

/** GET /api/patient/favorites — ids of the doctors this patient starred. */
export async function GET(request: Request) {
  const auth = await requireUser(request, ['patient'])
  if (auth instanceof NextResponse) return auth
  const { data, error } = await supabaseAdmin.from('favorite_doctors').select('doctor_id').eq('patient_id', auth.uid).order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: 'Could not load your favourites' }, { status: 500 })
  return NextResponse.json({ doctorIds: (data ?? []).map((r: { doctor_id: string }) => r.doctor_id) })
}

/** POST /api/patient/favorites  { doctorId } — star a verified doctor (safe to repeat). */
export async function POST(request: Request) {
  const auth = await requireUser(request, ['patient'])
  if (auth instanceof NextResponse) return auth
  const body = await request.json().catch(() => ({}))
  const doctorId = typeof body?.doctorId === 'string' ? body.doctorId : ''
  if (!doctorId) return NextResponse.json({ error: 'doctorId required' }, { status: 400 })

  const { data: doctor } = await supabaseAdmin.from('doctor_profiles').select('id, is_verified').eq('id', doctorId).maybeSingle()
  if (!doctor || !doctor.is_verified) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })

  // Already starred: nothing to do
  const { data: existing } = await supabaseAdmin.from('favorite_doctors').select('id').eq('patient_id', auth.uid).eq('doctor_id', doctorId).maybeSingle()
  if (existing) return NextResponse.json({ success: true })

  const { count } = await supabaseAdmin.from('favorite_doctors').select('id', { count: 'exact', head: true }).eq('patient_id', auth.uid)
  if ((count ?? 0) >= MAX_FAVORITES) return NextResponse.json({ error: `You can star up to ${MAX_FAVORITES} doctors.` }, { status: 409 })

  const { error } = await supabaseAdmin.from('favorite_doctors').insert({ patient_id: auth.uid, doctor_id: doctorId })
  // 23505: already starred, which is what the patient wanted
  if (error && error.code !== '23505') return NextResponse.json({ error: 'Could not save your favourite' }, { status: 500 })
  return NextResponse.json({ success: true })
}

/** DELETE /api/patient/favorites  { doctorId } — un-star. */
export async function DELETE(request: Request) {
  const auth = await requireUser(request, ['patient'])
  if (auth instanceof NextResponse) return auth
  const body = await request.json().catch(() => ({}))
  const doctorId = typeof body?.doctorId === 'string' ? body.doctorId : ''
  if (!doctorId) return NextResponse.json({ error: 'doctorId required' }, { status: 400 })
  await supabaseAdmin.from('favorite_doctors').delete().eq('patient_id', auth.uid).eq('doctor_id', doctorId)
  return NextResponse.json({ success: true })
}
