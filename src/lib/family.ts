import { supabaseAdmin } from './supabase-admin'

export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
export const MAX_FAMILY = 10
export const FAMILY_COLUMNS = 'id, full_name, relation, date_of_birth, gender, blood_type'

export type FamilyMember = { id: string; full_name: string; relation: string | null; date_of_birth: string | null; gender: string | null; blood_type: string | null }
/** What is stored on a visit booked for a family member (appointments.intake.booked_for). */
export type BookedFor = FamilyMember

const clip = (v: unknown, max: number): string | null => {
  if (v === undefined || v === null) return null
  if (typeof v !== 'string') throw new Error('invalid')
  const t = v.replace(/[\u0000-\u001f]/g, ' ').trim()
  if (t.length > max) throw new Error('too long')
  return t || null
}

/** Validate what the app sent. Throws a message a person can read. */
export function cleanMember(body: Record<string, unknown>, partial = false): Partial<Omit<FamilyMember, 'id'>> {
  const out: Partial<Omit<FamilyMember, 'id'>> = {}
  try {
    if (!partial || 'full_name' in body) {
      const name = clip(body.full_name, 100)
      if (!name) throw new Error('Enter their name')
      out.full_name = name
    }
    if ('relation' in body) out.relation = clip(body.relation, 30)
    if ('gender' in body) out.gender = clip(body.gender, 30)
    if ('blood_type' in body) {
      const bt = clip(body.blood_type, 3)
      if (bt && !BLOOD_TYPES.includes(bt)) throw new Error('Choose a blood type from the list')
      out.blood_type = bt
    }
    if ('date_of_birth' in body) {
      const dob = clip(body.date_of_birth, 10)
      if (dob) {
        const d = new Date(`${dob}T00:00:00Z`)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dob) || Number.isNaN(d.getTime()) || d > new Date() || d.getUTCFullYear() < 1900) throw new Error('Enter a valid date of birth')
      }
      out.date_of_birth = dob
    }
  } catch (e) {
    throw new Error(e instanceof Error && !['invalid', 'too long'].includes(e.message) ? e.message : 'Some details are too long or invalid')
  }
  return out
}

/** One of this account's family members, or null. */
export async function loadFamilyMember(ownerId: string, id: string): Promise<FamilyMember | null> {
  const { data } = await supabaseAdmin.from('family_members').select(FAMILY_COLUMNS).eq('id', id).eq('owner_id', ownerId).maybeSingle()
  return (data as FamilyMember | null) ?? null
}
