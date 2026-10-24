import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireUser } from '@/lib/api-auth'

// POST — promote user to doctor
export async function POST(request: Request) {
  const auth = await requireUser(request, ['super_admin'])
  if (auth instanceof NextResponse) return auth
  const uid = auth.uid

  const { userId, specialty, consultationFee } = await request.json()
  if (!userId || !specialty) return NextResponse.json({ error: 'userId and specialty required' }, { status: 400 })
  if (userId === uid) return NextResponse.json({ error: 'You cannot change your own role' }, { status: 400 })

  await supabaseAdmin.from('profiles').update({ role: 'doctor' }).eq('id', userId)

  const { data: existing } = await supabaseAdmin
    .from('doctor_profiles')
    .select('id')
    .eq('profile_id', userId)
    .maybeSingle()

  if (!existing) {
    await supabaseAdmin.from('doctor_profiles').insert({
      profile_id: userId,
      specialty,
      consultation_fee: Number(consultationFee) || 100,
      is_verified: true,
    })
  } else {
    await supabaseAdmin
      .from('doctor_profiles')
      .update({ specialty, consultation_fee: Number(consultationFee) || 100, is_verified: true })
      .eq('profile_id', userId)
  }

  await supabaseAdmin.from('audit_logs').insert({
    actor_id: uid,
    action: 'promote_to_doctor',
    target_table: 'profiles',
    target_id: userId,
    metadata: { specialty, consultationFee },
  })

  return NextResponse.json({ success: true })
}

// DELETE — demote doctor back to patient
export async function DELETE(request: Request) {
  const auth = await requireUser(request, ['super_admin'])
  if (auth instanceof NextResponse) return auth
  const uid = auth.uid

  const { userId } = await request.json()
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
  if (userId === uid) return NextResponse.json({ error: 'You cannot change your own role' }, { status: 400 })

  await supabaseAdmin.from('profiles').update({ role: 'patient' }).eq('id', userId)
  // Hide the doctor from search and booking once demoted
  await supabaseAdmin.from('doctor_profiles').update({ is_verified: false }).eq('profile_id', userId)

  await supabaseAdmin.from('audit_logs').insert({
    actor_id: uid,
    action: 'demote_to_patient',
    target_table: 'profiles',
    target_id: userId,
  })

  return NextResponse.json({ success: true })
}
