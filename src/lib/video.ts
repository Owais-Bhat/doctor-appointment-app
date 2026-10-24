import { clinicInstant } from './clinic-time'

/**
 * Whether to show the "Join video" button: from 15 minutes before the visit
 * until the end of that day. The server enforces the same window when a
 * room link is requested (see lib/visit-access.ts).
 */
export function canJoinVideo(date: string, time: string, now = new Date()): boolean {
  const start = clinicInstant(date, time.substring(0, 5))
  const endOfDay = clinicInstant(date, '23:59')
  return now.getTime() >= start.getTime() - 15 * 60_000 && now <= endOfDay
}
