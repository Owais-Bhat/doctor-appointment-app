import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyToken, unauthorized } from '@/lib/api-auth'

export async function GET(request: Request) {
  const uid = await verifyToken(request)
  if (!uid) return unauthorized()

  const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', uid).single()
  if (profile?.role !== 'super_admin') return unauthorized()

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const limit = Math.min(50, Number(searchParams.get('limit') ?? 25))
  const offset = (page - 1) * limit

  const { data, count, error } = await supabaseAdmin
    .from('audit_logs')
    .select(`
      id,
      action,
      target_table,
      target_id,
      metadata,
      created_at,
      profiles!audit_logs_actor_id_fkey (
        full_name,
        email,
        role
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    logs: data ?? [],
    total: count ?? 0,
    page,
    limit,
  })
}
