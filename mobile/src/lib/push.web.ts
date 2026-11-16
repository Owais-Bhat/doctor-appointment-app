/** Web build: there are no push notifications, so every call is a no-op (see push.ts). */

export type PushStatus = 'unavailable' | 'undetermined' | 'granted' | 'denied';

export const pushAvailable = false;

export async function getPushStatus(): Promise<PushStatus> {
  return 'unavailable';
}

export async function enablePush(): Promise<PushStatus> {
  return 'unavailable';
}

export async function registerPhone(): Promise<void> {}

export async function unregisterPhone(): Promise<void> {}

export async function showPushesInForeground(): Promise<void> {}

export function onPushOpened(open: (path: string) => void): () => void {
  void open;
  return () => undefined;
}
