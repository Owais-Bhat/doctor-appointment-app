import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/api-auth'
import { checkRateLimitByUser } from '@/lib/middleware/rateLimiter'
import { checkUpload, cleanFileName, cleanTitle } from '@/lib/files'
import { supabaseAdmin } from '@/lib/supabase-admin'

const MAX_DOCS = 10
const LIST = 'id, title, file_name, mime_type, size_bytes, created_at'

async function doctorId(uid: string): Promise<string | null> {
  const { data } = await supabaseAdmin.from('doctor_profiles').select('id').eq('profile_id', uid).maybeSingle()
  return data?.id ?? null
}

/** GET /api/doctor/documents — the verification documents this doctor uploaded (without the files). */
export async function GET(request: Request) {
  const auth = await requireUser(request, ['doctor'])
  if (auth instanceof NextResponse) return auth
  const dp = await doctorId(auth.uid)
  if (!dp) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })
  const { data, error } = await supabaseAdmin.from('doctor_documents').select(LIST).eq('doctor_id', dp).order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: 'Could not load your documents' }, { status: 500 })
  return NextResponse.json({ documents: data ?? [] })
}

/**
 * POST /api/doctor/documents  { title?, fileName?, data: <base64> }
 * e.g. the medical registration certificate. Only a super admin can open these.
 */
export async function POST(request: Request) {
  const auth = await requireUser(request, ['doctor'])
  if (auth instanceof NextResponse) return auth
  const dp = await doctorId(auth.uid)
  if (!dp) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })

  const limit = checkRateLimitByUser(`doc-upload:${auth.uid}`, { windowMs: 60_000, maxRequests: 6 })
  if (!limit.success) return NextResponse.json({ error: 'Too many uploads. Please wait a minute.' }, { status: 429 })

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  const file = checkUpload(body.data)
  if ('error' in file) return NextResponse.json({ error: file.error }, { status: 400 })

  const { count } = await supabaseAdmin.from('doctor_documents').select('id', { count: 'exact', head: true }).eq('doctor_id', dp)
  if ((count ?? 0) >= MAX_DOCS) return NextResponse.json({ error: `You can keep up to ${MAX_DOCS} documents. Delete one to add another.` }, { status: 409 })

  const fileName = cleanFileName(body.fileName)
  const { data, error } = await supabaseAdmin
    .from('doctor_documents')
    .insert({ doctor_id: dp, title: cleanTitle(body.title, fileName ?? 'Document'), file_name: fileName, mime_type: file.mime, size_bytes: file.size, data: file.base64 })
    .select(LIST)
    .single()
  if (error || !data) return NextResponse.json({ error: 'Could not save the document' }, { status: 500 })

  await supabaseAdmin.from('audit_logs').insert({ actor_id: auth.uid, action: 'doctor_document_uploaded', target_table: 'doctor_documents', target_id: data.id })
  return NextResponse.json({ document: data })
}
