import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth as getFirebaseAuth } from 'firebase-admin/auth';

function getValidPrivateKey(key: string | undefined): string | null {
  if (!key) return null;
  let cleaned = key.trim();
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  cleaned = cleaned.replace(/\\n/g, '\n');
  if (!cleaned.includes('BEGIN PRIVATE KEY')) return null;
  return cleaned;
}

const projectId =
  process.env.FIREBASE_ADMIN_PROJECT_ID ||
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  'demo-project';

const privateKey = getValidPrivateKey(process.env.FIREBASE_ADMIN_PRIVATE_KEY);
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;

if (!getApps().length) {
  if (privateKey && clientEmail) {
    try {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
    } catch (err) {
      console.warn('Firebase Admin credential initialization failed, falling back to projectId:', err);
      initializeApp({ projectId });
    }
  } else {
    initializeApp({ projectId });
  }
}

export const adminAuth = getFirebaseAuth();

/**
 * Verify a Firebase ID token.
 *
 * In production the Firebase project must be set explicitly.
 * If FIREBASE_ADMIN_PROJECT_ID is not set, it seamlessly falls back to
 * NEXT_PUBLIC_FIREBASE_PROJECT_ID.
 */
export async function verifyFirebaseToken(token: string) {
  const currentProjectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (process.env.NODE_ENV === 'production' && !currentProjectId) {
    throw new Error('Firebase Admin is not configured: set FIREBASE_ADMIN_PROJECT_ID or NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  }
  return adminAuth.verifyIdToken(token);
}
