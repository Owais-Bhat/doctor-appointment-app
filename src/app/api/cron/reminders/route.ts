import { NextResponse } from 'next/server'
import { runReminders } from '@/lib/reminders'

/**
 * GET /api/cron/reminders
 * Called every 15 minutes by a scheduler (Vercel Cron, Supabase pg_cron,
 * cron-job.org, ...) with `Authorization: Bearer <CRON_SECRET>`.
 * Vercel Cron sends that header automatically when CRON_SECRET is set.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET is not set' }, { status: 503 })
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const summary = await runReminders()
    if (summary.failures.length) console.error('Reminder delivery failures:', summary.failures)
    return NextResponse.json(summary)
  } catch (e) {
    console.error('Reminder run failed:', e)
    return NextResponse.json({ error: 'Reminder run failed' }, { status: 500 })
  }
}
