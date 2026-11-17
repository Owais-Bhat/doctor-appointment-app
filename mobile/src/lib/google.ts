import { GoogleAuthProvider, signInWithCredential, type Auth } from 'firebase/auth';

/** The OAuth web client of the Firebase project (the one in google-services.json, client_type 3). */
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

/** Thrown with a message a person can act on. */
export class GoogleSignInError extends Error {}

/**
 * Google sign-in on a phone: the system account picker gives a Google ID token,
 * which Firebase turns into the same account the website uses.
 * Returns false when the person closed the picker.
 */
export async function googleSignIn(auth: Auth): Promise<boolean> {
  if (!WEB_CLIENT_ID) throw new GoogleSignInError('Google sign-in is not configured for this build.');

  // Loaded on demand: the native module does not exist in Expo Go
  let mod: typeof import('@react-native-google-signin/google-signin');
  try {
    mod = await import('@react-native-google-signin/google-signin');
  } catch {
    throw new GoogleSignInError('Google sign-in needs the installed MedFlow app (it does not run in Expo Go).');
  }
  const { GoogleSignin, isErrorWithCode, statusCodes } = mod;

  try {
    GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const res = await GoogleSignin.signIn();
    if (res.type !== 'success') return false;
    const idToken = res.data.idToken;
    if (!idToken) throw new GoogleSignInError('Google did not return a sign-in token. Please try again.');
    await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
    return true;
  } catch (e) {
    if (e instanceof GoogleSignInError) throw e;
    if (isErrorWithCode(e)) {
      if (e.code === statusCodes.SIGN_IN_CANCELLED) return false;
      if (e.code === statusCodes.IN_PROGRESS) return false;
      if (e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) throw new GoogleSignInError('Google Play services are missing or out of date on this phone.');
      // Android reports a build that Google does not recognise as "DEVELOPER_ERROR" (code 10)
      if (/DEVELOPER_ERROR|\b10\b/.test(`${e.code} ${e.message}`)) {
        throw new GoogleSignInError('Google does not recognise this build yet. Its signing key (SHA-1) must be added in the Firebase console.');
      }
    }
    throw e;
  }
}
