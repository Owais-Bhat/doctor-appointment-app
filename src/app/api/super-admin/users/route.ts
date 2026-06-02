import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyToken, unauthorized } from '@/lib/api-auth'

export async function GET(request: Request) {
  const uid = await verifyToken(request)
  if (!uid) return unauthorized()

  const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', uid).single()
  if (profile?.role !== 'super_admin') return unauthorized()

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, email, role, blood_type, is_active, created_at')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ users: data ?? [] })
}
