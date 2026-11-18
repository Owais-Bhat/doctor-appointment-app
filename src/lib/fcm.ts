/**
 * Push straight through Firebase Cloud Messaging (no Expo account needed).
 * Uses the same Firebase service account the site already signs users in
 * with (FIREBASE_ADMIN_*), and the "Firebase Cloud Messaging API (V1)", which
 * Firebase projects have on by default.
 */
import { getApps } from 'firebase-admin/app'
import { getMessaging, type Message } from 'firebase-admin/messaging'

/** FCM device tokens look like "<id>:APA91b…", about 140–200 characters. */
const FCM_RE = /^[A-Za-z0-9_-]{8,}:[A-Za-z0-9_-]{40,}$/
export const MAX_TOKEN_LENGTH = 255
/** FCM takes at most 500 messages per call. */
const BATCH = 500

export const isFcmToken = (v: unknown): v is string => typeof v === 'string' && v.length <= MAX_TOKEN_LENGTH && FCM_RE.test(v)

export type FcmNotice = { title: string; body: string; url: string }

/** What the phone shows, and the in-app path it opens when tapped. */
export function fcmMessage(token: string, n: FcmNotice): Message {
  return {
    token,
    notification: { title: n.title, body: n.body },
    data: { url: n.url },
    android: { priority: 'high', notification: { channelId: 'default', sound: 'default' } },
  }
}

/** FCM answers these when the app was uninstalled or the token is no longer valid. */
export const isDeadTokenError = (code: string | undefined) =>
  code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token' || code === 'messaging/invalid-argument'

export type FcmResult = { ok: boolean; dead: boolean; error?: string }

/** Send these; the results line up with the messages. Throws only when FCM cannot be reached at all. */
export async function sendFcm(messages: Message[]): Promise<FcmResult[]> {
  const app = getApps().find((a) => a.name === '[DEFAULT]')
  if (!app) throw new Error('Firebase is not set up on the server')
  const messaging = getMessaging(app)
  const out: FcmResult[] = []
  for (let i = 0; i < messages.length; i += BATCH) {
    const res = await messaging.sendEach(messages.slice(i, i + BATCH))
    for (const r of res.responses) {
      out.push(r.success ? { ok: true, dead: false } : { ok: false, dead: isDeadTokenError(r.error?.code), error: r.error?.code ?? r.error?.message })
    }
  }
  return out
}
