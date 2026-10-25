import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyToken, unauthorized } from '@/lib/api-auth'

export async function GET(request: Request) {
  const uid = await verifyToken(request)
  if (!uid) return unauthorized()

  const { data, error } = await supabaseAdmin
    .from('notifications')
    .select('id, title, message, type, is_read, created_at')
    .eq('user_id', uid)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ notifications: data ?? [] })
}

export async function PATCH(request: Request) {
  const uid = await verifyToken(request)
  if (!uid) return unauthorized()

  // { id } marks one notification read; { all: true } marks every unread one
  const { id, all } = await request.json().catch(() => ({}))
  if (!id && !all) return NextResponse.json({ error: 'id or all required' }, { status: 400 })

  let query = supabaseAdmin.from('notifications').update({ is_read: true }).eq('user_id', uid)
  query = all ? query.eq('is_read', false) : query.eq('id', id)
  const { error } = await query
  if (error) return NextResponse.json({ error: 'Could not update notifications' }, { status: 500 })

  return NextResponse.json({ success: true })
}
