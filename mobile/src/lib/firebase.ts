import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
// getReactNativePersistence ships in Firebase's React Native build of firebase/auth
// (Metro resolves it); the default web typings don't declare it.
// @ts-expect-error -- not in the web type declarations
import { getAuth, getReactNativePersistence, initializeAuth, type Auth } from 'firebase/auth';
import { Platform } from 'react-native';

/**
 * Same Firebase project as the web app, so one account works on both.
 * Copy the web app's NEXT_PUBLIC_FIREBASE_* values into mobile/.env as
 * EXPO_PUBLIC_FIREBASE_* (see .env.example).
 */
const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseConfigured = Boolean(config.apiKey && config.projectId && config.appId);

let cached: Auth | null = null;

/** Firebase Auth, or null when the project isn't configured yet. */
export function getFirebaseAuth(): Auth | null {
  if (!firebaseConfigured) return null;
  if (cached) return cached;

  const fresh = getApps().length === 0;
  const app = fresh ? initializeApp(config) : getApp();

  cached =
    Platform.OS === 'web' || !fresh
      ? getAuth(app)
      : // Keep the user signed in between launches
        initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  return cached;
}
