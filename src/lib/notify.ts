import { after } from 'next/server'
import { supabaseAdmin } from './supabase-admin'
import { pushToPhones } from './push'

export type Notice = {
  /** Who it is for (profiles.id). Rows without one are skipped. */
  user_id: string | null | undefined
  title: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'reminder'
  related_appointment_id?: string | null
}

/**
 * Tell people something: it appears in their in-app notifications and, if
 * they use the mobile app, as a push notification on their phone.
 *
 * The push goes out after the response has been sent, so it never slows down
 * or breaks the request that caused it. Returns the database error, if any,
 * for callers that want to log it.
 */
export async function notify(notices: Notice | Notice[]) {
  const rows = (Array.isArray(notices) ? notices : [notices])
    .filter((n): n is Notice & { user_id: string } => !!n.user_id)
    .map((n) => ({
      user_id: n.user_id,
      title: n.title,
      message: n.message,
      type: n.type ?? 'info',
      ...(n.related_appointment_id ? { related_appointment_id: n.related_appointment_id } : {}),
    }))
  if (!rows.length) return { error: null }

  const { error } = await supabaseAdmin.from('notifications').insert(rows)
  if (!error) after(() => pushToPhones(rows))
  return { error }
}
