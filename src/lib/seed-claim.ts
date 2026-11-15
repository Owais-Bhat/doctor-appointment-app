import { supabaseAdmin } from './supabase-admin'

/** Ids of profiles reserved by mysql/seed-super-admin.sql start with this. */
const SEED_PREFIX = 'seed-'

export type ClaimResult = 'claimed' | 'needs_verified_email' | 'none'

/**
 * A profile can be reserved for an email address before that person has a
 * sign-in (see mysql/seed-super-admin.sql). On their first sign-in this hands
 * the reserved profile — and its role — to their real Firebase user id.
 *
 * The email must be verified: anyone can register an address they do not own,
 * and that must never be enough to become an administrator.
 */
export async function claimSeededProfile(
  uid: string,
  email: string | undefined,
  emailVerified: boolean,
): Promise<ClaimResult> {
  const address = email?.trim().toLowerCase()
  if (!address) return 'none'

  const { data: rows } = await supabaseAdmin.from('profiles').select('id, role, full_name').eq('email', address)
  const seed = (rows ?? []).find((r) => typeof r.id === 'string' && r.id.startsWith(SEED_PREFIX))
  if (!seed) return 'none'
  if (!emailVerified) return 'needs_verified_email'

  const { data: own } = await supabaseAdmin.from('profiles').select('id').eq('id', uid).maybeSingle()
  if (own) {
    // They signed in before verifying and already have a profile: move the role over
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ role: seed.role, email: address, is_active: true, updated_at: new Date().toISOString() })
      .eq('id', uid)
    if (error) return 'none'
    await supabaseAdmin.from('profiles').delete().eq('id', seed.id)
  } else {
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ id: uid, updated_at: new Date().toISOString() })
      .eq('id', seed.id)
    if (error) return 'none'
  }

  await supabaseAdmin.from('audit_logs').insert({
    actor_id: uid,
    action: 'claim_seeded_admin',
    target_table: 'profiles',
    target_id: uid,
  })
  return 'claimed'
}
