import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { Appearance } from 'react-native';

/**
 * The person's theme choice: follow the phone, or always light, or always dark.
 * Kept in storage so it survives restarts, and mirrored into the OS appearance
 * so native pieces (keyboard, alerts, status bar) follow it too.
 */
export type ThemePref = 'system' | 'light' | 'dark';

const KEY = 'medflow.theme';
let pref: ThemePref = 'system';
const listeners = new Set<() => void>();

const valid = (v: unknown): v is ThemePref => v === 'system' || v === 'light' || v === 'dark';

function set(next: ThemePref, persist: boolean) {
  pref = next;
  try {
    Appearance.setColorScheme?.(next === 'system' ? 'unspecified' : next);
  } catch {
    // not available on every platform
  }
  listeners.forEach((l) => l());
  if (persist) AsyncStorage.setItem(KEY, next).catch(() => undefined);
}

export function setThemePref(next: ThemePref) {
  set(next, true);
}

/** Call once at start-up. */
export async function loadThemePref(): Promise<void> {
  try {
    const saved = await AsyncStorage.getItem(KEY);
    if (valid(saved)) set(saved, false);
  } catch {
    // storage unavailable: stay on "system"
  }
}

export function useThemePref(): ThemePref {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => pref,
    () => 'system' as ThemePref,
  );
}
