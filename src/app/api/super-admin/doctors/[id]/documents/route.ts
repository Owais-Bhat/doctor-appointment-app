import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

/** GET /api/super-admin/doctors/:id/documents — what a doctor uploaded for verification (id = the doctor's profile row id). */
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(request, ['super_admin'])
  if (auth instanceof NextResponse) return auth
  const { id } = await context.params
  const { data, error } = await supabaseAdmin
    .from('doctor_documents')
    .select('id, title, file_name, mime_type, size_bytes, created_at')
    .eq('doctor_id', id)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: 'Could not load documents' }, { status: 500 })
  return NextResponse.json({ documents: data ?? [] })
}
