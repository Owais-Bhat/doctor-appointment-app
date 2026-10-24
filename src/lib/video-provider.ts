/**
 * Server-side video room setup for a visit.
 *
 * Daily (preferred): set DAILY_API_KEY. Each visit gets a PRIVATE room and
 * only its patient and doctor receive a meeting token, so a leaked link is
 * useless on its own. Free plan: 10,000 participant minutes a month.
 *
 * Jitsi (fallback): NEXT_PUBLIC_JITSI_DOMAIN (your own server or JaaS).
 * The room name is the appointment's random UUID.
 */
import { clinicInstant } from './clinic-time'

export type JoinInfo =
  | { provider: 'daily'; url: string; expiresAt: string }
  | { provider: 'jitsi'; url: string; expiresAt: string }

type Visit = { id: string; appointment_date: string }
type Who = { name: string; isDoctor: boolean }

const DAILY_API = 'https://api.daily.co/v1'

/** Rooms and tokens stop working an hour after the visit day ends. */
function expiry(visit: Visit) {
  return new Date(clinicInstant(visit.appointment_date, '23:59').getTime() + 60 * 60_000)
}

async function daily<T>(path: string, init: RequestInit = {}): Promise<{ ok: boolean; status: number; data: T }> {
  const res = await fetch(`${DAILY_API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${process.env.DAILY_API_KEY}`, 'Content-Type': 'application/json', ...init.headers },
    signal: AbortSignal.timeout(10_000),
  })
  return { ok: res.ok, status: res.status, data: (await res.json().catch(() => ({}))) as T }
}

async function dailyJoin(visit: Visit, who: Who): Promise<JoinInfo> {
  const exp = expiry(visit)
  const expSec = Math.floor(exp.getTime() / 1000)
  const name = `medflow-${visit.id}`

  type Room = { url?: string; error?: string; info?: string }
  let room = await daily<Room>('/rooms', {
    method: 'POST',
    body: JSON.stringify({
      name,
      privacy: 'private',
      properties: { exp: expSec, eject_at_room_exp: true, enable_chat: true, enable_screenshare: true, enable_prejoin_ui: false, max_participants: 4 },
    }),
  })
  if (!room.ok) {
    // Already created by the other participant: fetch it instead
    room = await daily<Room>(`/rooms/${name}`)
  }
  if (!room.ok || !room.data.url) throw new Error(`Daily room: ${room.data.error ?? room.data.info ?? room.status}`)

  const token = await daily<{ token?: string; error?: string }>('/meeting-tokens', {
    method: 'POST',
    body: JSON.stringify({
      properties: { room_name: name, user_name: who.name, is_owner: who.isDoctor, exp: expSec, eject_at_token_exp: true },
    }),
  })
  if (!token.ok || !token.data.token) throw new Error(`Daily token: ${token.data.error ?? token.status}`)

  return { provider: 'daily', url: `${room.data.url}?t=${token.data.token}`, expiresAt: exp.toISOString() }
}

function jitsiJoin(visit: Visit, who: Who): JoinInfo {
  const domain = process.env.NEXT_PUBLIC_JITSI_DOMAIN || 'meet.jit.si'
  // Jitsi reads the hash as key=JSON pairs decoded with decodeURIComponent
  const hash = [
    ['config.prejoinConfig.enabled', 'false'],
    ['config.disableDeepLinking', 'true'],
    ['userInfo.displayName', JSON.stringify(who.name)],
  ].map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')
  return { provider: 'jitsi', url: `https://${domain}/medflow-${visit.id}#${hash}`, expiresAt: expiry(visit).toISOString() }
}

export function videoProvider(): 'daily' | 'jitsi' {
  return process.env.DAILY_API_KEY ? 'daily' : 'jitsi'
}

export async function joinVisit(visit: Visit, who: Who): Promise<JoinInfo> {
  return videoProvider() === 'daily' ? dailyJoin(visit, who) : jitsiJoin(visit, who)
}
