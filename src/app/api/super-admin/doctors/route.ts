import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireUser } from '@/lib/api-auth'
import { AccountError, createEmailAccount } from '@/lib/firebase-admin'

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

const ACCOUNT_ERRORS: Record<AccountError['code'], string> = {
  email_exists: 'This email already has a sign-in. Ask them to sign in once, then use “Make doctor” on the Users page.',
  weak_password: 'Choose a stronger password.',
  invalid_email: 'Enter a valid email address.',
  unavailable: 'The sign-in could not be created. Check the Firebase settings on the server and try again.',
}

/**
 * POST /api/super-admin/doctors
 *   { fullName, email, password, specialty, consultationFee, registrationNumber?, registrationCouncil? }
 * Add a doctor who has no account yet: creates their sign-in, their profile
 * and a verified doctor profile. The admin passes the password on to them.
 */
export async function POST(request: Request) {
  const auth = await requireUser(request, ['super_admin'])
  if (auth instanceof NextResponse) return auth

  const body = await request.json().catch(() => ({}))
  const fullName = text(body.fullName, 120)
  const email = text(body.email, 255).toLowerCase()
  const password = typeof body.password === 'string' ? body.password : ''
  const specialty = text(body.specialty, 100)
  const registrationNumber = text(body.registrationNumber, 40)
  const registrationCouncil = text(body.registrationCouncil, 100)
  const fee = body.consultationFee === undefined || body.consultationFee === '' ? 500 : Number(body.consultationFee)

  if (!fullName || !specialty) return NextResponse.json({ error: 'Name and specialty are required' }, { status: 400 })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 })
  if (password.length < 8 || password.length > 128) {
    return NextResponse.json({ error: 'Use at least 8 characters for the password' }, { status: 400 })
  }
  if (!Number.isFinite(fee) || fee < 0 || fee > 100000) {
    return NextResponse.json({ error: 'Consultation fee must be between 0 and 1,00,000' }, { status: 400 })
  }

  const { data: taken } = await supabaseAdmin.from('profiles').select('id').eq('email', email).limit(1)
  if (taken?.length) {
    return NextResponse.json({ error: 'This email already has an account. Use “Make doctor” on the Users page.' }, { status: 409 })
  }

  let account: { uid: string; existing: boolean }
  try {
    account = await createEmailAccount(email, password, fullName)
  } catch (err) {
    const code = err instanceof AccountError ? err.code : 'unavailable'
    return NextResponse.json({ error: ACCOUNT_ERRORS[code] }, { status: code === 'unavailable' ? 502 : 400 })
  }

  // The sign-in may already exist with a profile that has no email saved (e.g. a Google sign-in)
  const { data: owner } = await supabaseAdmin.from('profiles').select('id, role').eq('id', account.uid).maybeSingle()
  if (owner?.role === 'super_admin') return NextResponse.json({ error: 'Admins cannot be made doctors' }, { status: 400 })

  const { error: profileError } = owner
    ? await supabaseAdmin.from('profiles').update({ role: 'doctor', full_name: fullName, email, updated_at: new Date().toISOString() }).eq('id', account.uid)
    : await supabaseAdmin.from('profiles').insert({ id: account.uid, full_name: fullName, email, role: 'doctor' })
  if (profileError) {
    console.error('Add doctor: profile error', profileError)
    return NextResponse.json({ error: 'The sign-in was created, but the profile could not be saved. Try again.' }, { status: 500 })
  }

  const details = {
    specialty,
    consultation_fee: fee,
    is_verified: true,
    registration_number: registrationNumber || null,
    registration_council: registrationCouncil || null,
  }
  const { data: existingDoctor } = await supabaseAdmin.from('doctor_profiles').select('id').eq('profile_id', account.uid).maybeSingle()
  const { error: doctorError } = existingDoctor
    ? await supabaseAdmin.from('doctor_profiles').update(details).eq('profile_id', account.uid)
    : await supabaseAdmin.from('doctor_profiles').insert({ profile_id: account.uid, ...details })
  if (doctorError) {
    console.error('Add doctor: doctor profile error', doctorError)
    return NextResponse.json({ error: 'The account was created, but the doctor profile could not be saved. Use “Make doctor” on the Users page.' }, { status: 500 })
  }

  await supabaseAdmin.from('notifications').insert({
    user_id: account.uid,
    title: 'Welcome to MedFlow for doctors',
    message: 'Your doctor account is ready. Set your weekly hours so patients can book you.',
    type: 'success',
  })
  await supabaseAdmin.from('audit_logs').insert({
    actor_id: auth.uid,
    action: 'create_doctor',
    target_table: 'profiles',
    target_id: account.uid,
  })

  // existing: the email already had a sign-in, so its password was not changed
  return NextResponse.json({ success: true, existing: account.existing })
}

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
