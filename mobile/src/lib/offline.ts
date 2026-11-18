import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

/**
 * A small offline memory. The last good answer for a few screens (the visits
 * list, a visit with its prescription, doctors, the clinic's day, notifications)
 * is kept on this phone so the app still shows something with no connection.
 * It lives in the app's private storage, is kept per signed-in person and is
 * wiped at sign-out. Uploaded reports and documents, family members, health
 * profiles and the files themselves are never kept. Turn on the app lock if
 * others can pick up the phone.
 */
const PREFIX = 'cache:';
const CACHEABLE = ['/api/patient/appointments', '/api/visits/', '/api/doctor/appointments', '/api/doctor/stats', '/api/doctor/patients', '/api/doctors', '/api/patient/notifications'];

export const isCacheable = (path: string) => CACHEABLE.some((p) => path === p || path.startsWith(`${p}?`) || path.startsWith(`${p}/`));

let scope = 'public';
/** Who the cache belongs to; set when the signed-in person changes. */
export function setCacheScope(uid: string | null) {
  scope = uid ?? 'public';
}
const keyOf = (path: string) => `${PREFIX}${scope}:${path}`;

export async function cacheSet(path: string, data: unknown): Promise<void> {
  if (!isCacheable(path)) return;
  try {
    await AsyncStorage.setItem(keyOf(path), JSON.stringify({ at: Date.now(), data }));
  } catch {
    // storage full or unavailable: the app just works online-only
  }
}

export async function cacheGet<T>(path: string): Promise<{ data: T; at: number } | null> {
  if (!isCacheable(path)) return null;
  try {
    const raw = await AsyncStorage.getItem(keyOf(path));
    return raw ? (JSON.parse(raw) as { data: T; at: number }) : null;
  } catch {
    return null;
  }
}

/** Forget everything kept for this phone (sign-out). */
export async function clearCache(): Promise<void> {
  try {
    const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(PREFIX));
    if (keys.length) await AsyncStorage.multiRemove(keys);
  } catch {
    // nothing to clear
  }
}

/* The "no connection" flag the banner shows. */
let offline = false;
const listeners = new Set<() => void>();
export function setOffline(next: boolean) {
  if (offline === next) return;
  offline = next;
  listeners.forEach((l) => l());
}
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
export const useOffline = () => useSyncExternalStore(subscribe, () => offline, () => offline);
