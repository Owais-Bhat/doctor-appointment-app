/**
 * Appointment dates and times are stored as the clinic's wall-clock time
 * ("2026-10-25", "10:30") without a zone. Servers (e.g. Vercel) run in UTC,
 * so every "is this in the past?" or "what is today?" question must be
 * answered in the clinic's time zone, not the server's.
 *
 * Set NEXT_PUBLIC_TIME_ZONE (IANA name) for clinics outside India.
 */
export const CLINIC_TZ = process.env.NEXT_PUBLIC_TIME_ZONE || 'Asia/Kolkata'

const partsFmt = new Map<string, Intl.DateTimeFormat>()
function fmt(tz: string) {
  let f = partsFmt.get(tz)
  if (!f) {
    f = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    })
    partsFmt.set(tz, f)
  }
  return f
}

/** Wall-clock parts of an instant in the clinic's zone. */
function wallParts(instant: Date, tz = CLINIC_TZ) {
  const p: Record<string, number> = {}
  for (const { type, value } of fmt(tz).formatToParts(instant)) {
    if (type !== 'literal') p[type] = Number(value)
  }
  return p as { year: number; month: number; day: number; hour: number; minute: number; second: number }
}

const pad = (n: number) => String(n).padStart(2, '0')

/** Today's date (YYYY-MM-DD) at the clinic. */
export function clinicToday(now = new Date(), tz = CLINIC_TZ): string {
  const p = wallParts(now, tz)
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`
}

/** First day of the current month (YYYY-MM-01) at the clinic. */
export function clinicMonthStart(now = new Date(), tz = CLINIC_TZ): string {
  return `${clinicToday(now, tz).slice(0, 7)}-01`
}

/** The real instant of a clinic wall-clock date and time ("HH:MM" or "HH:MM:SS"). */
export function clinicInstant(date: string, time: string, tz = CLINIC_TZ): Date {
  const [y, m, d] = date.split('-').map(Number)
  const [hh, mm] = time.split(':').map(Number)
  const wallAsUtc = Date.UTC(y, m - 1, d, hh, mm)
  // offset = (wall clock of the guess, read as UTC) - guess; apply twice for DST edges
  let guess = wallAsUtc
  for (let i = 0; i < 2; i++) {
    const p = wallParts(new Date(guess), tz)
    const seen = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
    guess = wallAsUtc - (seen - guess)
  }
  return new Date(guess)
}

/** Add days to a YYYY-MM-DD date string. */
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d + days))
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`
}
