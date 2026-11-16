import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireUser } from '@/lib/api-auth'
import { notify } from '@/lib/notify'

// POST — promote user to doctor
export async function POST(request: Request) {
  const auth = await requireUser(request, ['super_admin'])
  if (auth instanceof NextResponse) return auth
  const uid = auth.uid

  const body = await request.json().catch(() => ({}))
  const userId = typeof body.userId === 'string' ? body.userId : ''
  const specialty = typeof body.specialty === 'string' ? body.specialty.trim().slice(0, 100) : ''
  const consultationFee = body.consultationFee
  if (!userId || !specialty) return NextResponse.json({ error: 'userId and specialty required' }, { status: 400 })
  if (userId === uid) return NextResponse.json({ error: 'You cannot change your own role' }, { status: 400 })

  const fee = Number(consultationFee)
  if (consultationFee !== undefined && (!Number.isFinite(fee) || fee < 0 || fee > 100000)) {
    return NextResponse.json({ error: 'Consultation fee must be between 0 and 1,00,000' }, { status: 400 })
  }
  const { data: target } = await supabaseAdmin.from('profiles').select('role, is_active').eq('id', userId).maybeSingle()
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (target.is_active === false) return NextResponse.json({ error: 'Reactivate the account first' }, { status: 400 })
  if (target.role === 'super_admin') return NextResponse.json({ error: 'Admins cannot be made doctors' }, { status: 400 })

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

  await notify({
    user_id: userId,
    title: 'Welcome to MedFlow for doctors',
    message: 'Your doctor account is ready. Set your weekly hours so patients can book you.',
    type: 'success',
  })

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

  const { userId } = await request.json().catch(() => ({}))
  if (!userId || typeof userId !== 'string') return NextResponse.json({ error: 'userId required' }, { status: 400 })
  if (userId === uid) return NextResponse.json({ error: 'You cannot change your own role' }, { status: 400 })

  const { data: target } = await supabaseAdmin.from('profiles').select('role').eq('id', userId).maybeSingle()
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (target.role !== 'doctor') return NextResponse.json({ error: 'Only doctors can be changed back to patients' }, { status: 400 })

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
