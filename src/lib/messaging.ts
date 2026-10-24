/**
 * Outgoing SMS / WhatsApp through Twilio's REST API (no SDK needed).
 *
 * REMINDER_CHANNEL   sms | whatsapp | none (default: none → in-app only)
 * TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN
 * TWILIO_SMS_FROM        e.g. +15005550006 (or a Messaging Service SID "MG…")
 * TWILIO_WHATSAPP_FROM   e.g. +14155238886 (the "whatsapp:" prefix is added)
 * DEFAULT_COUNTRY_CODE   prefix for 10-digit local numbers (default +91)
 */

export type Channel = 'sms' | 'whatsapp'
export type SendResult = { ok: true; id: string } | { ok: false; error: string }

export function configuredChannel(): Channel | null {
  const c = (process.env.REMINDER_CHANNEL ?? 'none').toLowerCase()
  if (c !== 'sms' && c !== 'whatsapp') return null
  const from = c === 'sms' ? process.env.TWILIO_SMS_FROM : process.env.TWILIO_WHATSAPP_FROM
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !from) return null
  return c
}

/**
 * Normalise a phone number to E.164 (+919876543210). Returns null when it
 * can't be a real number, so we never text a half-typed value.
 */
export function toE164(raw: string | null | undefined, defaultCc = process.env.DEFAULT_COUNTRY_CODE || '+91'): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  let digits = trimmed.replace(/[^\d]/g, '')
  if (trimmed.startsWith('+')) return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null
  if (digits.startsWith('00')) digits = digits.slice(2)
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1) // 0 + 10-digit trunk prefix
  if (digits.length === 10) return `${defaultCc}${digits}`
  return digits.length >= 11 && digits.length <= 15 ? `+${digits}` : null
}

export async function sendMessage(channel: Channel, to: string, body: string): Promise<SendResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from = channel === 'sms' ? process.env.TWILIO_SMS_FROM : process.env.TWILIO_WHATSAPP_FROM
  if (!sid || !token || !from) return { ok: false, error: 'Messaging is not configured' }

  const form = new URLSearchParams({ To: channel === 'whatsapp' ? `whatsapp:${to}` : to, Body: body })
  if (channel === 'sms' && from.startsWith('MG')) form.set('MessagingServiceSid', from)
  else form.set('From', channel === 'whatsapp' ? `whatsapp:${from}` : from)

  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form,
      signal: AbortSignal.timeout(10_000),
    })
    const data = (await res.json().catch(() => ({}))) as { sid?: string; message?: string; code?: number }
    if (!res.ok) return { ok: false, error: `Twilio ${res.status}${data.code ? ` (${data.code})` : ''}: ${data.message ?? 'request failed'}` }
    return { ok: true, id: data.sid ?? '' }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'network error' }
  }
}
