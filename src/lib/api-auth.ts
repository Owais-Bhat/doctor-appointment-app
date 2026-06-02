import { adminAuth } from './firebase-admin'
import { NextResponse } from 'next/server'

export async function verifyToken(request: Request): Promise<string | null> {
  const auth = request.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null
  try {
    const decoded = await adminAuth.verifyIdToken(auth.slice(7))
    return decoded.uid
  } catch {
    return null
  }
}

export const unauthorized = () => NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
