import { GoogleAuthProvider, signInWithPopup, type Auth } from 'firebase/auth';

export class GoogleSignInError extends Error {}

/** Web build: the usual Google pop-up. Returns false when it was closed. */
export async function googleSignIn(auth: Auth): Promise<boolean> {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    await signInWithPopup(auth, provider);
    return true;
  } catch (e) {
    const code = (e as { code?: string })?.code ?? '';
    if (code.includes('popup-closed') || code.includes('cancelled-popup')) return false;
    if (code.includes('popup-blocked')) throw new GoogleSignInError('Your browser blocked the Google window. Allow pop-ups and try again.');
    throw e;
  }
}
