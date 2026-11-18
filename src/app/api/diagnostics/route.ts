import { NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/middleware/rateLimiter'

const clip = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f]/g, ' ').slice(0, max) : '')

/**
 * POST /api/diagnostics  { message, stack?, where?, version?, platform? }
 * The mobile app reports a crash here so it shows up in the server log. Nothing
 * is stored and nothing identifies the person: no sign-in, no account id.
 * Limited per address and per size so it cannot be used to flood the log.
 */
export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (!checkRateLimit(`diagnostics:${ip}`, { windowMs: 60_000, maxRequests: 10 }).success) {
    return NextResponse.json({ ok: false }, { status: 429 })
  }
  const raw = await request.text()
  if (raw.length > 8000) return NextResponse.json({ ok: false }, { status: 413 })
  let body: Record<string, unknown> = {}
  try {
    body = JSON.parse(raw)
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
  const message = clip(body.message, 500)
  if (!message) return NextResponse.json({ ok: false }, { status: 400 })

  console.error(`[client-error] ${clip(body.platform, 20) || '?'} v${clip(body.version, 20) || '?'} ${clip(body.where, 80)}: ${message}\n${clip(body.stack, 3000)}`)
  return NextResponse.json({ ok: true })
}
