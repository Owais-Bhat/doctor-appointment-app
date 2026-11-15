import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth as getFirebaseAuth, type Auth } from 'firebase-admin/auth';

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

function parseJwtAudience(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
      if (typeof payload.aud === 'string' && payload.aud && payload.aud !== 'demo-project') {
        return payload.aud;
      }
    }
  } catch {}
  return null;
}

function isPlaceholder(val?: string | null): boolean {
  if (!val) return true;
  const s = val.trim().toLowerCase();
  return s === '' || s === 'none' || s === 'demo-project' || s.startsWith('e.g.') || s.startsWith('i9ju');
}

const envProjectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const defaultProjectId = !isPlaceholder(envProjectId) ? (envProjectId as string) : 'demo-project';
const privateKey = getValidPrivateKey(process.env.FIREBASE_ADMIN_PRIVATE_KEY);
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;

// Initialize default app if not already initialized
if (!getApps().some((a) => a.name === '[DEFAULT]')) {
  if (privateKey && clientEmail && !isPlaceholder(defaultProjectId)) {
    try {
      initializeApp({
        credential: cert({
          projectId: defaultProjectId,
          clientEmail,
          privateKey,
        }),
        projectId: defaultProjectId,
      });
    } catch (err) {
      console.warn('Firebase Admin credential initialization failed, falling back to projectId:', err);
      initializeApp({ projectId: defaultProjectId });
    }
  } else {
    initializeApp({ projectId: defaultProjectId });
  }
}

function getAuthForProject(targetProjectId: string): Auth {
  const defaultApp = getApps().find((a) => a.name === '[DEFAULT]');
  if (defaultApp && defaultApp.options.projectId === targetProjectId) {
    return getFirebaseAuth(defaultApp);
  }

  const appName = `proj_${targetProjectId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  const existing = getApps().find((a) => a.name === appName);
  if (existing) return getFirebaseAuth(existing);

  const app = initializeApp({ projectId: targetProjectId }, appName);
  return getFirebaseAuth(app);
}

export const adminAuth = getFirebaseAuth();

/**
 * Verify a Firebase ID token.
 * Dynamically resolves the project ID from token aud or environment variables,
 * and validates the cryptographic signature using Google's public keys.
 */
export async function verifyFirebaseToken(token: string) {
  const tokenAud = parseJwtAudience(token);
  const targetProjectId = !isPlaceholder(envProjectId)
    ? (envProjectId as string)
    : (tokenAud || defaultProjectId);

  const auth = getAuthForProject(targetProjectId);
  return auth.verifyIdToken(token);
}
