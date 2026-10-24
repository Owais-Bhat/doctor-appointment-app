import { clinicInstant } from './clinic-time'

/**
 * Video visits use a Jitsi Meet room named after the appointment id.
 * The id is a random UUID, so the room name cannot be guessed. Doctor and
 * patient open the same link. Set NEXT_PUBLIC_JITSI_DOMAIN to use a
 * self-hosted Jitsi server instead of the public meet.jit.si.
 */
const DOMAIN = process.env.NEXT_PUBLIC_JITSI_DOMAIN || 'meet.jit.si'

export function videoRoomUrl(appointmentId: string): string {
  return `https://${DOMAIN}/medflow-${appointmentId}`
}

/** The room opens 15 minutes before the visit and stays open for the day. */
export function canJoinVideo(date: string, time: string, now = new Date()): boolean {
  const start = clinicInstant(date, time.substring(0, 5))
  const endOfDay = clinicInstant(date, '23:59')
  return now.getTime() >= start.getTime() - 15 * 60_000 && now <= endOfDay
}
