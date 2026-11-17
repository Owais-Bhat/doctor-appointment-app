/**
 * Push notifications for the mobile app, sent through Expo's push service
 * (which forwards to Android FCM and Apple APNs).
 *
 * Each phone registers an Expo push token (POST /api/push/register). When the
 * app creates an in-app notification (lib/notify.ts) the same title and
 * message are pushed to that person's phones.
 *
 * Uses the push_tokens table. On MySQL the database client creates it on
 * first use; on Supabase run supabase/migrations/006_push_tokens.sql. If it
 * cannot be used, nothing is sent and registration answers 503; everything
 * else keeps working.
 *
 * EXPO_ACCESS_TOKEN is only needed if "enhanced security for push" is turned
 * on for the Expo project. EXPO_PUSH_URL points at a different push service
 * (used by tests).
 */
import { supabaseAdmin } from './supabase-admin'

const PUSH_API = process.env.EXPO_PUSH_URL || 'https://exp.host/--/api/v2/push'
const TOKEN_RE = /^Expo(nent)?PushToken\[[A-Za-z0-9_-]{10,100}\]$/
/** Expo accepts at most 100 messages per request. */
const BATCH = 100
/** Expo recommends reading receipts about 15 minutes after sending. */
const RECEIPT_DELAY_MS = 15 * 60_000

export type PushNotice = {
  user_id: string
  title: string
  message: string
  related_appointment_id?: string | null
}

type TokenRow = { id: string; user_id: string; token: string }
type Ticket = { status?: string; id?: string; message?: string; details?: { error?: string } }

export function isPushToken(value: unknown): value is string {
  return typeof value === 'string' && TOKEN_RE.test(value)
}

async function expo<T>(path: string, body: unknown): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json' }
  if (process.env.EXPO_ACCESS_TOKEN) headers.Authorization = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`
  const res = await fetch(`${PUSH_API}${path}`, { method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(10_000) })
  const json = (await res.json().catch(() => ({}))) as { data?: T; errors?: { message?: string }[] }
  if (!res.ok || json.data === undefined) throw new Error(json.errors?.[0]?.message ?? `Expo push answered ${res.status}`)
  return json.data
}

/**
 * Remember this phone for this person. A token belongs to one phone, so if
 * someone else signed in on it before, it moves to the new person.
 * Returns false when the token could not be stored (e.g. the table is missing).
 */
export async function savePushToken(userId: string, token: string, platform: string | null): Promise<boolean> {
  const now = new Date().toISOString()
  const { data: existing, error } = await supabaseAdmin.from('push_tokens').select('id').eq('token', token).maybeSingle()
  if (error) return false

  if (existing) {
    const { error: updateError } = await supabaseAdmin
      .from('push_tokens')
      .update({ user_id: userId, platform, updated_at: now })
      .eq('id', existing.id)
    return !updateError
  }

  const { error: insertError } = await supabaseAdmin.from('push_tokens').insert({ user_id: userId, token, platform })
  // 23505: the same phone registered twice at once — the other request stored it
  return !insertError || insertError.code === '23505'
}

/** Forget this phone (sign-out). Only the person it is registered to can remove it. */
export async function removePushToken(userId: string, token: string): Promise<void> {
  await supabaseAdmin.from('push_tokens').delete().eq('token', token).eq('user_id', userId)
}

/**
 * Push these notifications to the phones of the people they are for.
 * Never throws: a push that fails must not undo the booking, payment or
 * reminder that caused it.
 */
export async function pushToPhones(notices: PushNotice[]): Promise<void> {
  try {
    const userIds = [...new Set(notices.map((n) => n.user_id).filter(Boolean))]
    if (!userIds.length) return

    const { data, error } = await supabaseAdmin.from('push_tokens').select('id, user_id, token').in('user_id', userIds)
    if (error || !data?.length) return
    const phones = data as TokenRow[]

    const outbox = notices.flatMap((n) =>
      phones
        .filter((p) => p.user_id === n.user_id)
        .map((p) => ({
          phone: p,
          message: {
            to: p.token,
            title: n.title,
            body: n.message,
            sound: 'default',
            channelId: 'default',
            // Opened by the app when the notification is tapped
            data: { url: n.related_appointment_id ? '/visits' : '/notifications' },
          },
        })),
    )

    const gone: string[] = []
    const ticketByPhone = new Map<string, string>()
    for (let i = 0; i < outbox.length; i += BATCH) {
      const batch = outbox.slice(i, i + BATCH)
      const tickets = await expo<Ticket[]>('/send', batch.map((o) => o.message))
      tickets.forEach((ticket, j) => {
        const phone = batch[j]?.phone
        if (!phone) return
        if (ticket.status === 'ok' && ticket.id) ticketByPhone.set(phone.id, ticket.id)
        else if (ticket.details?.error === 'DeviceNotRegistered') gone.push(phone.id)
        else console.error('Push not accepted:', ticket.message ?? ticket.details?.error ?? 'unknown error')
      })
    }

    if (gone.length) await supabaseAdmin.from('push_tokens').delete().in('id', gone)
    // Kept so checkPushReceipts() can learn later whether the phone still exists
    const sentAt = new Date().toISOString()
    for (const [id, ticket] of ticketByPhone) {
      await supabaseAdmin.from('push_tokens').update({ last_ticket_id: ticket, last_ticket_at: sentAt }).eq('id', id)
    }
  } catch (e) {
    console.error('Push failed:', e instanceof Error ? e.message : e)
  }
}

/**
 * Read Expo's delivery receipts for pushes sent at least 15 minutes ago and
 * forget phones that Apple or Google report as gone (app uninstalled,
 * notifications revoked). Called by the reminders cron job.
 */
export async function checkPushReceipts(now = new Date()): Promise<{ checked: number; removed: number }> {
  const summary = { checked: 0, removed: 0 }
  try {
    const { data, error } = await supabaseAdmin
      .from('push_tokens')
      .select('id, last_ticket_id')
      .lt('last_ticket_at', new Date(now.getTime() - RECEIPT_DELAY_MS).toISOString())
      .limit(1000)
    if (error) return summary
    const rows = ((data ?? []) as { id: string; last_ticket_id: string | null }[]).filter(
      (r): r is { id: string; last_ticket_id: string } => !!r.last_ticket_id,
    )
    if (!rows.length) return summary

    const receipts = await expo<Record<string, Ticket>>('/getReceipts', { ids: rows.map((r) => r.last_ticket_id) })
    const gone = rows.filter((r) => receipts[r.last_ticket_id]?.details?.error === 'DeviceNotRegistered').map((r) => r.id)
    for (const r of rows) {
      const receipt = receipts[r.last_ticket_id]
      if (receipt?.status === 'error' && receipt.details?.error !== 'DeviceNotRegistered') {
        // e.g. InvalidCredentials or MismatchSenderId: the push credentials need fixing
        console.error('Push receipt error:', receipt.details?.error ?? receipt.message ?? 'unknown error')
      }
    }

    if (gone.length) await supabaseAdmin.from('push_tokens').delete().in('id', gone)
    const kept = rows.filter((r) => !gone.includes(r.id)).map((r) => r.id)
    if (kept.length) await supabaseAdmin.from('push_tokens').update({ last_ticket_id: null, last_ticket_at: null }).in('id', kept)

    summary.checked = rows.length
    summary.removed = gone.length
  } catch (e) {
    console.error('Push receipt check failed:', e instanceof Error ? e.message : e)
  }
  return summary
}
