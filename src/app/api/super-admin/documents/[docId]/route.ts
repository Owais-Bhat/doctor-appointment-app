import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/api-auth'
import { fileResponse } from '@/lib/files'
import { supabaseAdmin } from '@/lib/supabase-admin'

/** GET /api/super-admin/documents/:docId — the file itself, for the admin deciding whether to verify the doctor. */
export async function GET(request: Request, context: { params: Promise<{ docId: string }> }) {
  const auth = await requireUser(request, ['super_admin'])
  if (auth instanceof NextResponse) return auth
  const { docId } = await context.params
  const { data: doc } = await supabaseAdmin.from('doctor_documents').select('mime_type, file_name, data').eq('id', docId).maybeSingle()
  if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  return fileResponse(doc.data, doc.mime_type, doc.file_name)
}
