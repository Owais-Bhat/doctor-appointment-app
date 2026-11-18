import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/api-auth'
import { checkRateLimitByUser } from '@/lib/middleware/rateLimiter'
import { checkUpload, cleanFileName, cleanTitle } from '@/lib/files'
import { supabaseAdmin } from '@/lib/supabase-admin'

const MAX_REPORTS = 40
const LIST = 'id, title, file_name, mime_type, size_bytes, appointment_id, created_at'

/** GET /api/patient/reports — this patient's uploaded reports (without the files). */
export async function GET(request: Request) {
  const auth = await requireUser(request, ['patient'])
  if (auth instanceof NextResponse) return auth
  const { data, error } = await supabaseAdmin.from('medical_reports').select(LIST).eq('patient_id', auth.uid).order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: 'Could not load your reports' }, { status: 500 })
  return NextResponse.json({ reports: data ?? [] })
}

/**
 * POST /api/patient/reports  { title?, fileName?, data: <base64>, appointmentId? }
 * Photos and PDFs up to 3 MB. Attaching to a visit lets that visit's doctor see it.
 */
export async function POST(request: Request) {
  const auth = await requireUser(request, ['patient'])
  if (auth instanceof NextResponse) return auth

  const limit = checkRateLimitByUser(`report-upload:${auth.uid}`, { windowMs: 60_000, maxRequests: 6 })
  if (!limit.success) return NextResponse.json({ error: 'Too many uploads. Please wait a minute.' }, { status: 429 })

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const file = checkUpload(body.data)
  if ('error' in file) return NextResponse.json({ error: file.error }, { status: 400 })

  const { count } = await supabaseAdmin.from('medical_reports').select('id', { count: 'exact', head: true }).eq('patient_id', auth.uid)
  if ((count ?? 0) >= MAX_REPORTS) return NextResponse.json({ error: `You can keep up to ${MAX_REPORTS} reports. Delete one to add another.` }, { status: 409 })

  let appointmentId: string | null = null
  if (body.appointmentId) {
    appointmentId = String(body.appointmentId)
    // Only the patient's own, still-relevant visit
    const { data: appt } = await supabaseAdmin.from('appointments').select('id, status').eq('id', appointmentId).eq('patient_id', auth.uid).maybeSingle()
    if (!appt || appt.status === 'cancelled') return NextResponse.json({ error: 'Visit not found' }, { status: 404 })
  }

  const fileName = cleanFileName(body.fileName)
  const { data, error } = await supabaseAdmin
    .from('medical_reports')
    .insert({
      patient_id: auth.uid,
      appointment_id: appointmentId,
      title: cleanTitle(body.title, fileName ?? 'Report'),
      file_name: fileName,
      mime_type: file.mime,
      size_bytes: file.size,
      data: file.base64,
    })
    .select(LIST)
    .single()
  if (error || !data) return NextResponse.json({ error: 'Could not save the report' }, { status: 500 })
  return NextResponse.json({ report: data })
}
