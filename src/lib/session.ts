/**
 * Signed role cookie used by the proxy to guard pages.
 *
 * Format: `<role>.<expiresAtSeconds>.<base64url HMAC-SHA256>`
 * The signature stops users from forging `userRole=super_admin` in the browser.
 * Uses Web Crypto so it runs in both the proxy and route handlers.
 *
 * Verification is strict: a cookie without a valid signature for a current
 * secret, or past its expiry, is treated as signed out. This only guards page
 * access; every API route still verifies the Firebase token and loads the
 * role from the database.
 */

export const SESSION_COOKIE = 'userRole'
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

const ROLES = ['patient', 'doctor', 'super_admin'] as const
export type SessionRole = (typeof ROLES)[number]

const isRole = (v: string): v is SessionRole => (ROLES as readonly string[]).includes(v)

/**
 * Secrets the cookie may be signed with, newest first. Never a value that is
 * in the repository or exposed to the browser.
 *  1. SESSION_SECRET (at least 32 characters)
 *  2. A key derived from private server-only credentials, so a deployment
 *     with a missing or short SESSION_SECRET still has an unguessable secret
 *  3. A fixed development value, outside production only
 * In production with none of these available there are no secrets, so no
 * cookie can be issued or accepted.
 */
function getSecrets(): string[] {
  const secrets: string[] = []
  const env = process.env.SESSION_SECRET
  if (env && env.length >= 32) secrets.push(env)

  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY || process.env.MYSQL_PASSWORD
  if (privateKey && privateKey.length >= 8) secrets.push(`medflow-session-v1:${privateKey}`)

  if (secrets.length === 0 && process.env.NODE_ENV !== 'production') {
    secrets.push('dev-only-insecure-session-secret-change-me')
  }
  return secrets
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
  const [secret] = getSecrets()
  if (!secret) throw new Error('SESSION_SECRET must be set (at least 32 characters) in production')
  const exp = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE
  const payload = `${role}.${exp}`
  return `${payload}.${await sign(payload, secret)}`
}

/** Returns the role if the cookie is correctly signed and unexpired, otherwise null. */
export async function readSessionRole(value: string | undefined): Promise<SessionRole | null> {
  if (!value) return null

  let clean = value.trim()
  if (clean.startsWith('"') && clean.endsWith('"')) clean = clean.slice(1, -1)
  try {
    clean = decodeURIComponent(clean)
  } catch {
    return null
  }

  const parts = clean.split('.')
  if (parts.length !== 3) return null
  const [role, exp, sig] = parts

  if (!isRole(role) || !/^\d{1,12}$/.test(exp)) return null
  if (Number(exp) < Date.now() / 1000) return null

  const payload = `${role}.${exp}`
  for (const secret of getSecrets()) {
    try {
      if (safeEqual(sig, await sign(payload, secret))) return role
    } catch {
      // try the next secret
    }
  }
  return null
}
