/**
 * Display helpers shared by the patient, doctor and admin portals.
 */

/** Currency used for display and Stripe charges (ISO 4217, e.g. "USD", "INR"). */
export const CURRENCY = (process.env.NEXT_PUBLIC_CURRENCY || 'USD').toUpperCase()

export function formatFee(amount: number | string | null | undefined): string {
  const value = Number(amount ?? 0)
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: CURRENCY,
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value)
}

/** "Sarah Johnson" or "Dr. Sarah Johnson" -> "Dr. Sarah Johnson" (never "Dr. Dr."). */
export function doctorName(name: string | null | undefined): string {
  const clean = (name ?? '').trim()
  if (!clean) return 'Your doctor'
  return /^dr\.?\s/i.test(clean) ? clean.replace(/^dr\.?\s+/i, 'Dr. ') : `Dr. ${clean}`
}

export function initials(name: string | null | undefined): string {
  const parts = (name ?? '').replace(/^dr\.?\s+/i, '').trim().split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || '?'
}

/** Stable hue (0-359) from a name, for avatar colors. */
export function nameHue(name: string): number {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360
  return h
}

/** Local YYYY-MM-DD (not UTC, so late-evening users get the right "today"). */
export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function parseISODate(date: string): Date {
  return new Date(`${date}T00:00:00`)
}

/** "Today", "Tomorrow" or "Mon, 3 Nov". */
export function formatDay(date: string): string {
  const d = parseISODate(date)
  const today = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(today.getDate() + 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
}

/** For sentences: "today", "tomorrow" or "on Mon, 3 Nov". */
export function onDay(date: string): string {
  const label = formatDay(date)
  return label === 'Today' || label === 'Tomorrow' ? label.toLowerCase() : `on ${label}`
}

/** "14:30" or "14:30:00" -> "2:30 PM" */
export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

export const VISIT_TYPE_LABEL: Record<string, string> = {
  video: 'Video visit',
  phone: 'Phone call',
  in_person: 'In-person visit',
}

export const STATUS_LABEL: Record<string, string> = {
  pending: 'Awaiting confirmation',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'Missed',
}

/** Time-of-day greeting for the signed-in user. */
export function greeting(date = new Date()): string {
  const h = date.getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}
