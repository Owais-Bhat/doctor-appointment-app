import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { api, setTokenGetter } from '@/lib/api';
import { firebaseConfigured, getFirebaseAuth } from '@/lib/firebase';
import { GoogleSignInError, googleSignIn } from '@/lib/google';
import { unregisterPhone } from '@/lib/push';
import type { Profile } from '@/lib/types';

type Status = 'loading' | 'signedOut' | 'ready';

type AuthValue = {
  status: Status;
  profile: Profile | null;
  firebaseConfigured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  /** Resolves false when the person closed the Google picker. */
  signInWithGoogle: () => Promise<boolean>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

/** Firebase error codes in words a person can act on (same wording as the web app). */
export function authErrorMessage(err: unknown): string {
  const code = ((err as { code?: string })?.code ?? (err instanceof Error ? err.message : '')).toLowerCase();
  if (/invalid-credential|wrong-password|user-not-found|invalid-login/.test(code)) return 'That email and password don’t match. Check them or reset your password.';
  if (code.includes('invalid-email')) return 'Enter a valid email address.';
  if (code.includes('email-already-in-use')) return 'An account with this email already exists. Sign in instead.';
  if (code.includes('weak-password')) return 'Use at least 8 characters for your password.';
  if (code.includes('too-many-requests')) return 'Too many attempts. Wait a few minutes or reset your password.';
  if (code.includes('network-request-failed')) return 'No connection. Check your internet and try again.';
  if (code.includes('user-disabled')) return 'This account has been suspended. Contact support.';
  if (err instanceof GoogleSignInError) return err.message;
  if (code.includes('account-exists-with-different-credential')) return 'This email already has a password sign-in. Sign in with your password instead.';
  if (err instanceof Error && code && !code.startsWith('auth/')) return err.message;
  return 'Unable to sign in. Please try again.';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>(firebaseConfigured ? 'loading' : 'signedOut');
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) return;

    setTokenGetter(async (forceRefresh) => (auth.currentUser ? auth.currentUser.getIdToken(forceRefresh) : null));

    return onAuthStateChanged(auth, async (user: User | null) => {
      if (!user) {
        setProfile(null);
        setStatus('signedOut');
        return;
      }
      try {
        // Also creates the profile on a first sign-in
        let res = await api<{ profile: Profile | null }>('/api/auth/me');
        // A first Google sign-in creates the profile as "New User": give it their Google name
        const name = user.displayName?.trim();
        if (res.profile?.full_name === 'New User' && name) {
          const token = await user.getIdToken();
          await api('/api/auth/register', { method: 'POST', auth: false, body: { token, fullName: name } }).catch(() => undefined);
          res = await api<{ profile: Profile | null }>('/api/auth/me');
        }
        setProfile(res.profile);
        setStatus(res.profile ? 'ready' : 'signedOut');
      } catch {
        // Server unreachable or the account is suspended
        setProfile(null);
        setStatus('signedOut');
      }
    });
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Sign-in is not set up yet.');
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Sign-in is not set up yet.');
    return googleSignIn(auth);
  }, []);

  const register = useCallback(async (fullName: string, email: string, password: string) => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Sign-in is not set up yet.');
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const token = await cred.user.getIdToken();
    // Creates the MedFlow profile (always a patient) with the name they typed
    await api('/api/auth/register', { method: 'POST', auth: false, body: { token, fullName } });
    const res = await api<{ profile: Profile | null }>('/api/auth/me');
    setProfile(res.profile);
    setStatus(res.profile ? 'ready' : 'signedOut');
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Sign-in is not set up yet.');
    await sendPasswordResetEmail(auth, email.trim());
  }, []);

  const signOut = useCallback(async () => {
    // While still signed in: this phone stops getting the account's notifications
    await unregisterPhone();
    const auth = getFirebaseAuth();
    if (auth) await firebaseSignOut(auth);
    setProfile(null);
    setStatus('signedOut');
  }, []);

  const value = useMemo(
    () => ({ status, profile, firebaseConfigured, signIn, signInWithGoogle, register, resetPassword, signOut }),
    [status, profile, signIn, signInWithGoogle, register, resetPassword, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
