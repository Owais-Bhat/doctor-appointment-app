import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireUser } from '@/lib/api-auth'

export async function GET(request: Request) {
  const auth = await requireUser(request, ['super_admin'])
  if (auth instanceof NextResponse) return auth

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, email, phone, role, is_active, created_at')
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) return NextResponse.json({ error: 'Could not load users' }, { status: 500 })
  return NextResponse.json({ users: data ?? [], me: auth.uid })
}

/**
 * PATCH /api/super-admin/users  { userId, is_active }
 * Suspend or reactivate an account. A suspended user is refused by every
 * API (requireUser) and, if a doctor, is hidden from booking until an
 * admin verifies them again.
 */
export async function PATCH(request: Request) {
  const auth = await requireUser(request, ['super_admin'])
  if (auth instanceof NextResponse) return auth

  const { userId, is_active } = await request.json().catch(() => ({}))
  if (!userId || typeof is_active !== 'boolean') {
    return NextResponse.json({ error: 'userId and is_active (true/false) required' }, { status: 400 })
  }
  if (userId === auth.uid) {
    return NextResponse.json({ error: 'You cannot suspend your own account' }, { status: 400 })
  }

  const { data: target } = await supabaseAdmin.from('profiles').select('id, role').eq('id', userId).maybeSingle()
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (target.role === 'super_admin') {
    return NextResponse.json({ error: 'Admins cannot be suspended here' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ is_active, updated_at: new Date().toISOString() })
    .eq('id', userId)
  if (error) return NextResponse.json({ error: 'Could not update the account' }, { status: 500 })

  if (!is_active && target.role === 'doctor') {
    await supabaseAdmin.from('doctor_profiles').update({ is_verified: false }).eq('profile_id', userId)
  }

  await supabaseAdmin.from('audit_logs').insert({
    actor_id: auth.uid,
    action: is_active ? 'reactivate_user' : 'suspend_user',
    target_table: 'profiles',
    target_id: userId,
  })

  return NextResponse.json({ success: true })
}
