/**
 * Signed role cookie used by the proxy to guard pages.
 *
 * Format: `<role>.<expiresAtSeconds>.<base64url HMAC-SHA256>`
 * The signature stops users from forging `userRole=super_admin` in the browser.
 * Uses Web Crypto so it runs in both the proxy and route handlers.
 */

export const SESSION_COOKIE = 'userRole'
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

const ROLES = ['patient', 'doctor', 'super_admin'] as const
export type SessionRole = (typeof ROLES)[number]

function getSecret(): string | null {
  const secret = process.env.SESSION_SECRET
  if (secret && secret.length >= 32) return secret
  if (process.env.NODE_ENV !== 'production') return 'dev-only-insecure-session-secret-change-me'
  return null
}

function toBase64Url(bytes: ArrayBuffer): string {
  let bin = ''
  for (const b of new Uint8Array(bytes)) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function sign(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  return toBase64Url(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload)))
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function createSessionValue(role: SessionRole): Promise<string> {
  const secret = getSecret()
  if (!secret) throw new Error('SESSION_SECRET must be set (at least 32 characters) in production')
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE
  const payload = `${role}.${exp}`
  return `${payload}.${await sign(payload, secret)}`
}

/** Returns the role if the cookie is valid and unexpired, otherwise null. */
export async function readSessionRole(value: string | undefined): Promise<SessionRole | null> {
  if (!value) return null
  const secret = getSecret()
  if (!secret) return null

  const parts = value.split('.')
  if (parts.length !== 3) return null
  const [role, exp, sig] = parts

  if (!(ROLES as readonly string[]).includes(role)) return null
  if (!/^\d+$/.test(exp) || Number(exp) < Date.now() / 1000) return null

  const expected = await sign(`${role}.${exp}`, secret)
  return safeEqual(sig, expected) ? (role as SessionRole) : null
}
