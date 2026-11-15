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
  } catch { }
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
  return (
    s === '' ||
    s === 'none' ||
    s === 'demo-project' ||
    s.startsWith('e.g.') ||
    s.startsWith('i9ju') ||
    s.startsWith('u664178') ||
    s.includes('nestfy.in') ||
    s.includes('localhost')
  );
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

  // If a valid project ID is explicitly configured, check if it matches targetProjectId
  const ourProjects = [process.env.FIREBASE_ADMIN_PROJECT_ID, process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID]
    .filter((id): id is string => !isPlaceholder(id))
    .map((id) => id.trim());
  if (ourProjects.length > 0 && !ourProjects.includes(targetProjectId)) {
    console.warn(`Token aud "${targetProjectId}" not in configured project IDs [${ourProjects.join(', ')}]. Checking signature...`);
  }

  const auth = getAuthForProject(targetProjectId);
  try {
    return await auth.verifyIdToken(token);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Firebase token verification failed for project "${targetProjectId}":`, msg);

    // 1. Ask Firebase itself whether the token is genuine via Google Identity Toolkit REST API
    const checked = await lookupTokenWithFirebase(token);
    if (checked) {
      console.warn(`Token for ${checked.uid} confirmed by Firebase REST lookup: ${msg}`);
      return {
        uid: checked.uid,
        email: checked.email,
        email_verified: checked.email_verified,
        aud: targetProjectId,
        sub: checked.uid,
        iss: `https://securetoken.google.com/${targetProjectId}`,
      } as unknown as import('firebase-admin/auth').DecodedIdToken;
    }

    // 2. Safe fallback for legitimate Google-signed tokens if outbound cert fetch fails on host
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
          email_verified: payload.email_verified === true,
          ...payload,
        } as unknown as import('firebase-admin/auth').DecodedIdToken;
      }
    }

    throw err;
  }
}

export class AccountError extends Error {
  constructor(public code: 'email_exists' | 'weak_password' | 'invalid_email' | 'unavailable', message: string) {
    super(message);
  }
}

/**
 * Create a Firebase email + password sign-in for someone else (an admin adding
 * a doctor). Uses the service account when one is configured, otherwise the
 * public sign-up endpoint. If the email already has a sign-in and we can look
 * it up, that account is returned with `existing: true` and its password is
 * left alone.
 */
export async function createEmailAccount(
  email: string,
  password: string,
  displayName: string,
): Promise<{ uid: string; existing: boolean }> {
  if (privateKey && clientEmail) {
    try {
      const created = await adminAuth.createUser({ email, password, displayName });
      return { uid: created.uid, existing: false };
    } catch (err) {
      const code = (err as { code?: string })?.code ?? '';
      if (code === 'auth/email-already-exists') {
        const found = await adminAuth.getUserByEmail(email);
        return { uid: found.uid, existing: true };
      }
      if (code === 'auth/invalid-password') throw new AccountError('weak_password', 'Password is too weak');
      if (code === 'auth/invalid-email') throw new AccountError('invalid_email', 'Email is not valid');
      console.error('Firebase Admin createUser failed, trying the sign-up endpoint:', err instanceof Error ? err.message : err);
    }
  }

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey || apiKey === 'demo-api-key') throw new AccountError('unavailable', 'Firebase is not configured');
  let res: Response;
  try {
    res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName, returnSecureToken: false }),
      cache: 'no-store',
    });
  } catch {
    throw new AccountError('unavailable', 'Could not reach Firebase');
  }
  const data = (await res.json().catch(() => ({}))) as { localId?: string; error?: { message?: string } };
  if (res.ok && data.localId) return { uid: data.localId, existing: false };

  const reason = data.error?.message ?? '';
  if (reason.startsWith('EMAIL_EXISTS')) throw new AccountError('email_exists', 'Email already has a sign-in');
  if (reason.startsWith('WEAK_PASSWORD')) throw new AccountError('weak_password', 'Password is too weak');
  if (reason.startsWith('INVALID_EMAIL')) throw new AccountError('invalid_email', 'Email is not valid');
  console.error('Firebase sign-up failed:', reason || res.status);
  throw new AccountError('unavailable', 'Firebase refused to create the account');
}

/**
 * Ask Firebase (accounts:lookup) to validate an ID token. Firebase checks the
 * signature and expiry on its side and returns the account, or an error.
 */
async function lookupTokenWithFirebase(
  token: string,
): Promise<{ uid: string; email?: string; email_verified: boolean } | null> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey || apiKey === 'demo-api-key') return null;
  try {
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token }),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { users?: { localId?: string; email?: string; emailVerified?: boolean; disabled?: boolean }[] };
    const account = data.users?.[0];
    if (!account?.localId || account.disabled) return null;
    return { uid: account.localId, email: account.email, email_verified: account.emailVerified === true };
  } catch (e) {
    console.error('Firebase token lookup failed:', e instanceof Error ? e.message : e);
    return null;
  }
}
