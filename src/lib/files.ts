/**
 * Uploaded files (medical reports, doctors' verification documents). They are
 * small images or PDFs, sent as base64 in a JSON body and stored in MySQL.
 * What the file really is gets checked from its first bytes, never from the
 * name or the type the client claims.
 */
export const MAX_FILE_BYTES = 3 * 1024 * 1024
export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const
export type AllowedType = (typeof ALLOWED_TYPES)[number]

const SIGNATURES: { type: AllowedType; test: (b: Buffer) => boolean }[] = [
  { type: 'image/jpeg', test: (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { type: 'image/png', test: (b) => b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { type: 'image/webp', test: (b) => b.length > 12 && b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP' },
  { type: 'application/pdf', test: (b) => b.length > 5 && b.subarray(0, 5).toString('latin1') === '%PDF-' },
]

export type CheckedFile = { mime: AllowedType; size: number; base64: string }

/** Validate an upload. Returns the clean file, or an error message a person can act on. */
export function checkUpload(base64: unknown): CheckedFile | { error: string } {
  if (typeof base64 !== 'string' || !base64) return { error: 'No file was sent' }
  // Allow a "data:…;base64," prefix, then only real base64
  const raw = base64.replace(/^data:[^,]*,/, '').replace(/\s+/g, '')
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(raw)) return { error: 'The file could not be read' }
  // Check the size before decoding: 4 base64 characters carry 3 bytes
  if (Math.floor((raw.length * 3) / 4) > MAX_FILE_BYTES) return { error: `The file is too large. The limit is ${MAX_FILE_BYTES / 1024 / 1024} MB.` }
  const bytes = Buffer.from(raw, 'base64')
  const found = SIGNATURES.find((s) => s.test(bytes))
  if (!found) return { error: 'Only photos (JPEG, PNG, WebP) and PDF files can be uploaded' }
  return { mime: found.type, size: bytes.length, base64: raw }
}

/** A short, safe title: trimmed, no control characters. */
export function cleanTitle(v: unknown, fallback: string, max = 120): string {
  const t = typeof v === 'string' ? v.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max) : ''
  return t || fallback
}

/** A file name safe to show and to put in a Content-Disposition header. */
export function cleanFileName(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const t = v.replace(/[\u0000-\u001f"\\/]/g, '_').trim().slice(0, 200)
  return t || null
}

/** Send stored base64 back as the file it is. Never cached, never sniffed, shown inline for images and PDFs. */
export function fileResponse(base64: string, mime: string, fileName: string | null): Response {
  const bytes = Buffer.from(base64, 'base64')
  const name = (fileName ?? 'file').replace(/[^\w.\- ]/g, '_')
  return new Response(new Uint8Array(bytes), {
    headers: {
      'Content-Type': mime,
      'Content-Length': String(bytes.length),
      'Content-Disposition': `inline; filename="${name}"`,
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox",
      'Cache-Control': 'private, no-store',
    },
  })
}
