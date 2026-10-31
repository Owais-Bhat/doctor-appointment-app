import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireUser } from '@/lib/api-auth'

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
/** Free-text health fields doctors see before a visit, with a length cap each. */
const HEALTH_TEXT: Record<string, number> = {
  allergies: 300,
  chronic_conditions: 300,
  medications: 300,
  bp: 20,
  emergency_contact_name: 80,
  emergency_contact_phone: 20,
}

export async function GET(request: Request) {
  const auth = await requireUser(request, ['patient'])
  if (auth instanceof NextResponse) return auth
  const uid = auth.uid

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, email, phone, blood_type, date_of_birth, gender, address, health_stats, reminders_enabled, created_at')
    .eq('id', uid)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ profile: data })
}

function text(v: unknown, max: number): string | null | undefined {
  if (v === undefined) return undefined
  if (v === null) return null
  if (typeof v !== 'string') throw new Error('invalid')
  const t = v.trim()
  if (t.length > max) throw new Error(`too long`)
  return t || null
}

export async function PATCH(request: Request) {
  const auth = await requireUser(request, ['patient'])
  if (auth instanceof NextResponse) return auth
  const uid = auth.uid

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  const bad = (error: string) => NextResponse.json({ error }, { status: 400 })

  const updates: Record<string, unknown> = {}
  try {
    if ('full_name' in body) {
      const name = text(body.full_name, 100)
      if (!name) return bad('Please enter your name')
      updates.full_name = name
    }
    if ('phone' in body) {
      const phone = text(body.phone, 20)
      if (phone && !/^\+?[\d\s()-]{7,20}$/.test(phone)) return bad('Enter a valid phone number')
      updates.phone = phone
    }
    if ('blood_type' in body) {
      const bt = text(body.blood_type, 3)
      if (bt && !BLOOD_TYPES.includes(bt)) return bad('Choose a blood type from the list')
      updates.blood_type = bt
    }
    if ('date_of_birth' in body) {
      const dob = text(body.date_of_birth, 10)
      if (dob) {
        const d = new Date(`${dob}T00:00:00Z`)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dob) || isNaN(d.getTime()) || d > new Date() || d.getUTCFullYear() < 1900) {
          return bad('Enter a valid date of birth')
        }
      }
      updates.date_of_birth = dob
    }
    if ('gender' in body) updates.gender = text(body.gender, 30)
    if ('address' in body) updates.address = text(body.address, 200)
    if ('reminders_enabled' in body) {
      if (typeof body.reminders_enabled !== 'boolean') return bad('reminders_enabled must be true or false')
      updates.reminders_enabled = body.reminders_enabled
    }
    if ('health_stats' in body) {
      const hs = body.health_stats
      if (hs === null || typeof hs !== 'object' || Array.isArray(hs)) return bad('Invalid health details')
      // Merge into what's stored so fields this form doesn't know about survive
      const { data: current } = await supabaseAdmin.from('profiles').select('health_stats').eq('id', uid).maybeSingle()
      const next: Record<string, unknown> = { ...(current?.health_stats ?? {}) }
      for (const [k, max] of Object.entries(HEALTH_TEXT)) {
        if (k in hs) next[k] = text(hs[k], max)
      }
      for (const [k, lo, hi] of [['weight', 1, 400], ['height', 30, 260]] as const) {
        if (!(k in hs)) continue
        const v = hs[k]
        if (v === null || v === '') next[k] = null
        else {
          const n = Number(v)
          if (!Number.isFinite(n) || n < lo || n > hi) return bad(`Enter a realistic ${k}`)
          next[k] = Math.round(n * 10) / 10
        }
      }
      updates.health_stats = next
    }
  } catch {
    return bad('Some details are too long or invalid')
  }

  if (Object.keys(updates).length === 0) return bad('Nothing to update')

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', uid)
    .select('id, full_name, email, phone, blood_type, date_of_birth, gender, address, health_stats, reminders_enabled, created_at')
    .single()

  if (error) return NextResponse.json({ error: 'Couldn’t save your profile' }, { status: 500 })
  return NextResponse.json({ profile: data })
}
