import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

import { api } from './api';

/**
 * Push notifications (iOS and Android; the web build uses push.web.ts).
 *
 * The phone hands a push token to the server (POST /api/push/register); the
 * server then pushes every in-app notification to it.
 *  - Android: the Firebase (FCM) device token. Needs only google-services.json
 *    in the build, no Expo account or project id.
 *  - iOS: an Expo push token, which needs an EAS project id.
 * Expo Go cannot receive remote pushes on Android, so there this module does nothing.
 */

export type PushStatus = 'unavailable' | 'undetermined' | 'granted' | 'denied';

const projectId: string | undefined = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
const inExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/** Whether this build can receive pushes at all. */
export const pushAvailable = !inExpoGo && (Platform.OS === 'android' || !!projectId);

/** Loaded only when needed: importing it inside Expo Go on Android logs an error. */
const notifications = () => import('expo-notifications');

/** The token this phone last registered, so sign-out can remove it. */
let registered: string | null = null;

export async function getPushStatus(): Promise<PushStatus> {
  if (!pushAvailable) return 'unavailable';
  const { getPermissionsAsync } = await notifications();
  const p = await getPermissionsAsync();
  return p.granted ? 'granted' : p.canAskAgain ? 'undetermined' : 'denied';
}

/** Shows the system permission prompt, then registers the phone if allowed. */
export async function enablePush(): Promise<PushStatus> {
  if (!pushAvailable) return 'unavailable';
  const N = await notifications();
  // Android 13+ only shows its prompt once a channel exists
  await ensureChannel(N);
  const p = await N.requestPermissionsAsync();
  if (!p.granted) return p.canAskAgain ? 'undetermined' : 'denied';
  await registerPhone();
  return 'granted';
}

async function ensureChannel(N: Awaited<ReturnType<typeof notifications>>) {
  if (Platform.OS !== 'android') return;
  // "default" is the channel the server sends to
  await N.setNotificationChannelAsync('default', {
    name: 'Visit updates',
    importance: N.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#007AFF',
  });
}

/**
 * Give the server this phone's push token. Call once permission is granted
 * (it is cheap to repeat, and the token can change after a reinstall).
 * Failures are swallowed: the app works without push.
 */
export async function registerPhone(): Promise<void> {
  if (!pushAvailable) return;
  try {
    const N = await notifications();
    await ensureChannel(N);
    // Android: Firebase's own token. Elsewhere: Expo's, which forwards to Apple
    const token = Platform.OS === 'android' ? String((await N.getDevicePushTokenAsync()).data) : (await N.getExpoPushTokenAsync({ projectId })).data;
    await api('/api/push/register', { method: 'POST', body: { token, platform: Platform.OS } });
    registered = token;
  } catch {
    // No network, push not set up on the server yet, or no Google Play services
  }
}

/** Sign-out: stop this phone receiving the account's notifications. Call while still signed in. */
export async function unregisterPhone(): Promise<void> {
  if (!registered) return;
  const token = registered;
  registered = null;
  await api('/api/push/register', { method: 'DELETE', body: { token } }).catch(() => undefined);
}

/** Notifications that arrive while the app is open still show as a banner. */
export async function showPushesInForeground(): Promise<void> {
  if (!pushAvailable) return;
  const N = await notifications();
  N.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
}

/**
 * Calls `open` with the in-app path of a notification the person tapped,
 * including the one that launched the app. Returns a function that stops listening.
 */
export function onPushOpened(open: (path: string) => void): () => void {
  if (!pushAvailable) return () => undefined;
  let stop = () => {};
  let cancelled = false;

  void notifications().then((N) => {
    if (cancelled) return;
    const handle = (data: Record<string, unknown> | undefined) => {
      const url = data?.url;
      // Only paths inside the app, never an outside link
      if (typeof url === 'string' && /^\/[a-z0-9/_-]*$/i.test(url)) open(url);
      N.clearLastNotificationResponse();
    };

    const launch = N.getLastNotificationResponse();
    if (launch) handle(launch.notification.request.content.data);

    const subscription = N.addNotificationResponseReceivedListener((r) => handle(r.notification.request.content.data));
    stop = () => subscription.remove();
  });

  return () => {
    cancelled = true;
    stop();
  };
}
