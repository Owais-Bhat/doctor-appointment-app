import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/api-auth'
import { checkRateLimitByUser } from '@/lib/middleware/rateLimiter'
import { isPushToken, removePushToken, savePushToken } from '@/lib/push'

const PLATFORMS = ['android', 'ios']

async function readToken(request: Request) {
  const body = await request.json().catch(() => ({}))
  return { token: body?.token as unknown, platform: PLATFORMS.includes(body?.platform) ? (body.platform as string) : null }
}

/**
 * POST /api/push/register  { token, platform }
 * The mobile app calls this after sign-in (with a Firebase or an Expo push token) so this person's notifications
 * also reach this phone. The person is taken from the sign-in token.
 */
export async function POST(request: Request) {
  // requireUser also refuses suspended accounts
  const auth = await requireUser(request)
  if (auth instanceof NextResponse) return auth

  const limit = checkRateLimitByUser(`push-register:${auth.uid}`, { windowMs: 60_000, maxRequests: 10 })
  if (!limit.success) return NextResponse.json({ error: 'Too many requests. Please wait a minute.' }, { status: 429 })

  const { token, platform } = await readToken(request)
  if (!isPushToken(token)) return NextResponse.json({ error: 'A valid push token is required' }, { status: 400 })

  const saved = await savePushToken(auth.uid, token, platform)
  if (!saved) return NextResponse.json({ error: 'Push notifications are not set up on the server yet.' }, { status: 503 })
  return NextResponse.json({ success: true })
}

/** DELETE /api/push/register  { token } — sign-out: stop sending to this phone. */
export async function DELETE(request: Request) {
  const auth = await requireUser(request)
  if (auth instanceof NextResponse) return auth

  const { token } = await readToken(request)
  if (!isPushToken(token)) return NextResponse.json({ error: 'A valid push token is required' }, { status: 400 })

  await removePushToken(auth.uid, token)
  return NextResponse.json({ success: true })
}
