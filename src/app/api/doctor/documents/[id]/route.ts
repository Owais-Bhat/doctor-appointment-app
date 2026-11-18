import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/api-auth'
import { fileResponse } from '@/lib/files'
import { supabaseAdmin } from '@/lib/supabase-admin'

/** GET /api/doctor/documents/:id — a doctor's own document. */
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(request, ['doctor'])
  if (auth instanceof NextResponse) return auth
  const { id } = await context.params
  const { data: dp } = await supabaseAdmin.from('doctor_profiles').select('id').eq('profile_id', auth.uid).maybeSingle()
  if (!dp) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })
  const { data: doc } = await supabaseAdmin.from('doctor_documents').select('mime_type, file_name, data').eq('id', id).eq('doctor_id', dp.id).maybeSingle()
  if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  return fileResponse(doc.data, doc.mime_type, doc.file_name)
}

/** DELETE /api/doctor/documents/:id */
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(request, ['doctor'])
  if (auth instanceof NextResponse) return auth
  const { id } = await context.params
  const { data: dp } = await supabaseAdmin.from('doctor_profiles').select('id').eq('profile_id', auth.uid).maybeSingle()
  if (!dp) return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })
  const { error } = await supabaseAdmin.from('doctor_documents').delete().eq('id', id).eq('doctor_id', dp.id)
  if (error) return NextResponse.json({ error: 'Could not delete the document' }, { status: 500 })
  return NextResponse.json({ success: true })
}
