import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireUser } from '@/lib/api-auth'

export async function GET(request: Request) {
  const auth = await requireUser(request, ['super_admin'])
  if (auth instanceof NextResponse) return auth

  const { searchParams } = new URL(request.url)
  // Whole numbers in range only ("abc" or negatives fall back to the defaults)
  const int = (v: string | null, fallback: number) => {
    const n = Number(v)
    return Number.isInteger(n) && n >= 1 ? n : fallback
  }
  const page = Math.min(10_000, int(searchParams.get('page'), 1))
  const limit = Math.min(50, int(searchParams.get('limit'), 25))
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

  if (error) return NextResponse.json({ error: 'Could not load the activity log' }, { status: 500 })

  return NextResponse.json({
    logs: data ?? [],
    total: count ?? 0,
    page,
    limit,
  })
}
