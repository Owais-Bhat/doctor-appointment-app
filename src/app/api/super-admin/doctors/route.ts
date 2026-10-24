import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireUser } from '@/lib/api-auth'

export async function GET(request: Request) {
  const auth = await requireUser(request, ['super_admin'])
  if (auth instanceof NextResponse) return auth
  const uid = auth.uid

  const { data, error } = await supabaseAdmin
    .from('doctor_profiles')
    .select(`
      id,
      specialty,
      rating,
      total_reviews,
      consultation_fee,
      is_verified,
      clinic_name,
      experience_years,
      created_at,
      profiles!doctor_profiles_profile_id_fkey (
        full_name,
        email,
        is_active
      )
    `)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ doctors: data ?? [] })
}

export async function PATCH(request: Request) {
  const auth = await requireUser(request, ['super_admin'])
  if (auth instanceof NextResponse) return auth
  const uid = auth.uid

  const { doctorId, is_verified } = await request.json()
  const { error } = await supabaseAdmin
    .from('doctor_profiles')
    .update({ is_verified })
    .eq('id', doctorId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabaseAdmin.from('audit_logs').insert({
    actor_id: uid,
    action: is_verified ? 'approve_doctor' : 'revoke_doctor',
    target_table: 'doctor_profiles',
    target_id: doctorId,
  })

  return NextResponse.json({ success: true })
}
