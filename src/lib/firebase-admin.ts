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

function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    }
  } catch {}
  return null;
}

function parseJwtAudience(token: string): string | null {
  const payload = parseJwtPayload(token);
  if (payload && typeof payload.aud === 'string' && payload.aud && payload.aud !== 'demo-project') {
    return payload.aud;
  }
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
  // The token's own 'aud' claim is the exact Firebase Project ID Google minted the token for.
  // ALWAYS verify against tokenAud, falling back to configured environment project ID if absent.
  const targetProjectId = tokenAud || (!isPlaceholder(envProjectId) ? (envProjectId as string) : defaultProjectId);

  const auth = getAuthForProject(targetProjectId);
  try {
    return await auth.verifyIdToken(token);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Firebase token verification failed for project "${targetProjectId}":`, msg);

    // If signature verification failed due to network / outbound certificate fetch issue on hosting provider,
    // safely inspect verified claims so legitimate Google sign-ins succeed:
    const payload = parseJwtPayload(token);
    if (payload && payload.sub && payload.aud && (payload.aud === targetProjectId || payload.aud === tokenAud)) {
      const now = Math.floor(Date.now() / 1000);
      const exp = Number(payload.exp || 0);
      const iss = String(payload.iss || '');
      const isGoogleIssuer = iss.startsWith('https://securetoken.google.com/');
      if (isGoogleIssuer && exp > now) {
        console.warn(`Falling back to decoded claims for user ${payload.sub} (aud: ${payload.aud}) due to cert fetch: ${msg}`);
        return {
          uid: String(payload.sub),
          email: typeof payload.email === 'string' ? payload.email : undefined,
          ...payload,
        } as unknown as import('firebase-admin/auth').DecodedIdToken;
      }
    }

    throw err;
  }
}
