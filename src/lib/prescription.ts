/**
 * A prescription is stored as JSON text in appointments.prescription (the
 * column already exists). Old rows may hold plain text; those read as advice.
 */
export type PrescriptionItem = { name: string; dose: string; frequency: string; duration: string; note: string }
export type Prescription = { items: PrescriptionItem[]; advice: string }

const MAX_ITEMS = 25
const clip = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

/** Read what is stored; never throws. null when there is nothing worth showing. */
export function parsePrescription(raw: unknown): Prescription | null {
  if (typeof raw !== 'string' || !raw.trim()) return null
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    return { items: [], advice: raw.trim().slice(0, 4000) }
  }
  return cleanPrescription(value)
}

/** Validate what a doctor sent. null when it is empty (which clears the prescription). */
export function cleanPrescription(input: unknown): Prescription | null {
  if (!input || typeof input !== 'object') return null
  const o = input as { items?: unknown; advice?: unknown }
  const items = (Array.isArray(o.items) ? o.items : [])
    .slice(0, MAX_ITEMS)
    .map((i) => {
      const r = (i ?? {}) as Record<string, unknown>
      return { name: clip(r.name, 120), dose: clip(r.dose, 60), frequency: clip(r.frequency, 80), duration: clip(r.duration, 60), note: clip(r.note, 200) }
    })
    .filter((i) => i.name)
  const advice = clip(o.advice, 4000)
  return items.length || advice ? { items, advice } : null
}

/** YYYY-MM-DD or null. */
export function cleanFollowUp(v: unknown): string | null {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null
  return Number.isNaN(Date.parse(`${v}T00:00:00Z`)) ? null : v
}
