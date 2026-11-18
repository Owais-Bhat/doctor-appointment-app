import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/api-auth'
import { cleanMember, FAMILY_COLUMNS } from '@/lib/family'
import { supabaseAdmin } from '@/lib/supabase-admin'

/** PATCH /api/patient/family/:id — change details. */
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(request, ['patient'])
  if (auth instanceof NextResponse) return auth
  const { id } = await context.params
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  let fields
  try {
    fields = cleanMember(body, true)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 })
  }
  if (Object.keys(fields).length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('family_members')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('owner_id', auth.uid)
    .select(FAMILY_COLUMNS)
  if (error) return NextResponse.json({ error: 'Could not save this person' }, { status: 500 })
  if (!data?.length) return NextResponse.json({ error: 'Person not found' }, { status: 404 })
  return NextResponse.json({ member: data[0] })
}

/** DELETE /api/patient/family/:id — visits already booked for them keep their name. */
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(request, ['patient'])
  if (auth instanceof NextResponse) return auth
  const { id } = await context.params
  const { error } = await supabaseAdmin.from('family_members').delete().eq('id', id).eq('owner_id', auth.uid)
  if (error) return NextResponse.json({ error: 'Could not remove this person' }, { status: 500 })
  return NextResponse.json({ success: true })
}
