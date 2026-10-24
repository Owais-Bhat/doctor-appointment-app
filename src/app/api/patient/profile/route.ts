import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyToken, unauthorized } from '@/lib/api-auth'

export async function GET(request: Request) {
  const uid = await verifyToken(request)
  if (!uid) return unauthorized()

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, email, phone, blood_type, date_of_birth, gender, address, health_stats, reminders_enabled, created_at')
    .eq('id', uid)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ profile: data })
}

export async function PATCH(request: Request) {
  const uid = await verifyToken(request)
  if (!uid) return unauthorized()

  const body = await request.json()
  const allowed = ['full_name', 'phone', 'blood_type', 'date_of_birth', 'gender', 'address', 'health_stats', 'reminders_enabled']
  const updates = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)))
  if ('reminders_enabled' in updates && typeof updates.reminders_enabled !== 'boolean') {
    return NextResponse.json({ error: 'reminders_enabled must be true or false' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', uid)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ profile: data })
}
