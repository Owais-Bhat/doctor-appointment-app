import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireUser } from '@/lib/api-auth'

export async function GET(request: Request) {
  const auth = await requireUser(request, ['super_admin'])
  if (auth instanceof NextResponse) return auth

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
      registration_number,
      registration_council,
      created_at,
      profiles!doctor_profiles_profile_id_fkey (
        full_name,
        email,
        is_active
      )
    `)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Could not load doctors' }, { status: 500 })
  return NextResponse.json({ doctors: data ?? [] })
}

/**
 * PATCH /api/super-admin/doctors  { doctorId, is_verified }
 * Verified doctors appear in search and can be booked. The doctor is notified.
 */
export async function PATCH(request: Request) {
  const auth = await requireUser(request, ['super_admin'])
  if (auth instanceof NextResponse) return auth
  const uid = auth.uid

  const { doctorId, is_verified } = await request.json().catch(() => ({}))
  if (!doctorId || typeof is_verified !== 'boolean') {
    return NextResponse.json({ error: 'doctorId and is_verified (true/false) required' }, { status: 400 })
  }

  const { data: doctor } = await supabaseAdmin
    .from('doctor_profiles')
    .select('id, profile_id, registration_number')
    .eq('id', doctorId)
    .maybeSingle()
  if (!doctor) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })

  if (is_verified) {
    const { data: account } = await supabaseAdmin
      .from('profiles').select('role, is_active').eq('id', doctor.profile_id).maybeSingle()
    if (!account || account.role !== 'doctor') {
      return NextResponse.json({ error: 'This account is no longer a doctor' }, { status: 400 })
    }
    // The registration is what verification checks (Telemedicine Practice Guidelines)
    if (!doctor.registration_number?.trim()) {
      return NextResponse.json({ error: 'Ask the doctor to add their medical registration number first' }, { status: 400 })
    }
    if (account.is_active === false) {
      return NextResponse.json({ error: 'Reactivate the account before verifying it' }, { status: 400 })
    }
  }

  const { error } = await supabaseAdmin
    .from('doctor_profiles')
    .update({ is_verified })
    .eq('id', doctorId)
  if (error) return NextResponse.json({ error: 'Could not update the doctor' }, { status: 500 })

  await supabaseAdmin.from('notifications').insert({
    user_id: doctor.profile_id,
    title: is_verified ? 'Your profile is live' : 'Your profile is hidden',
    message: is_verified
      ? 'MedFlow verified your profile. Patients can now find and book you.'
      : 'Your profile was removed from search while we review it. Existing visits are not affected.',
    type: is_verified ? 'success' : 'warning',
  })

  await supabaseAdmin.from('audit_logs').insert({
    actor_id: uid,
    action: is_verified ? 'approve_doctor' : 'revoke_doctor',
    target_table: 'doctor_profiles',
    target_id: doctorId,
  })

  return NextResponse.json({ success: true })
}
