import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/api-auth'
import { cleanMember, FAMILY_COLUMNS, MAX_FAMILY } from '@/lib/family'
import { supabaseAdmin } from '@/lib/supabase-admin'

/** GET /api/patient/family — the people this account books for. */
export async function GET(request: Request) {
  const auth = await requireUser(request, ['patient'])
  if (auth instanceof NextResponse) return auth
  const { data, error } = await supabaseAdmin.from('family_members').select(FAMILY_COLUMNS).eq('owner_id', auth.uid).order('created_at', { ascending: true })
  if (error) return NextResponse.json({ error: 'Could not load your family members' }, { status: 500 })
  return NextResponse.json({ members: data ?? [] })
}

/** POST /api/patient/family  { full_name, relation?, date_of_birth?, gender?, blood_type? } */
export async function POST(request: Request) {
  const auth = await requireUser(request, ['patient'])
  if (auth instanceof NextResponse) return auth
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  let fields
  try {
    fields = cleanMember(body)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 })
  }
  const { count } = await supabaseAdmin.from('family_members').select('id', { count: 'exact', head: true }).eq('owner_id', auth.uid)
  if ((count ?? 0) >= MAX_FAMILY) return NextResponse.json({ error: `You can add up to ${MAX_FAMILY} people.` }, { status: 409 })

  const { data, error } = await supabaseAdmin.from('family_members').insert({ owner_id: auth.uid, ...fields }).select(FAMILY_COLUMNS).single()
  if (error || !data) return NextResponse.json({ error: 'Could not save this person' }, { status: 500 })
  return NextResponse.json({ member: data })
}
