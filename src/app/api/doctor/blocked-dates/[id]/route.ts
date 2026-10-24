import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireUser } from '@/lib/api-auth'

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser(request, ['doctor'])
  if (auth instanceof NextResponse) return auth
  const uid = auth.uid

  const { id } = await context.params

  const { data: dp } = await supabaseAdmin
    .from('doctor_profiles')
    .select('id')
    .eq('profile_id', uid)
    .single()

  if (!dp) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })

  const { error } = await supabaseAdmin
    .from('blocked_dates')
    .delete()
    .eq('id', id)
    .eq('doctor_id', dp.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
