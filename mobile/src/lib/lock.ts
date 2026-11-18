import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

/**
 * Optional app lock: fingerprint, face or the phone's screen lock. When on,
 * MedFlow locks at start-up and again when it comes back from the background
 * after more than 30 seconds. The choice lives on this phone only.
 */
const KEY = 'medflow.lock';
const GRACE_MS = 30_000;

type State = { enabled: boolean; locked: boolean };
let state: State = { enabled: false, locked: false };
const listeners = new Set<() => void>();
let leftAt = 0;

function set(next: Partial<State>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useLockState = () => useSyncExternalStore(subscribe, () => state, () => state);

/** Whether this phone can lock the app at all (has biometrics or a screen lock set up). */
export async function lockAvailable(): Promise<boolean> {
  try {
    return (await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.isEnrolledAsync());
  } catch {
    return false;
  }
}

async function authenticate(prompt: string): Promise<boolean> {
  try {
    const res = await LocalAuthentication.authenticateAsync({ promptMessage: prompt, cancelLabel: 'Cancel' });
    return res.success;
  } catch {
    return false;
  }
}

/** Ask the phone to confirm it is the owner; unlocks the app when it is. */
export async function unlock(): Promise<boolean> {
  const ok = await authenticate('Unlock MedFlow');
  if (ok) set({ locked: false });
  return ok;
}

/** Turn the lock on or off. Turning it on needs one successful check first, so the person cannot lock themselves out. */
export async function setLockEnabled(on: boolean): Promise<boolean> {
  if (on) {
    if (!(await lockAvailable())) return false;
    if (!(await authenticate('Confirm to turn on the app lock'))) return false;
  }
  set({ enabled: on, locked: false });
  AsyncStorage.setItem(KEY, on ? '1' : '0').catch(() => undefined);
  return true;
}

let started = false;
/** Call once at start-up. */
export async function startLock(): Promise<void> {
  if (started) return;
  started = true;
  try {
    if ((await AsyncStorage.getItem(KEY)) === '1' && (await lockAvailable())) set({ enabled: true, locked: true });
  } catch {
    // storage unavailable: no lock
  }
  AppState.addEventListener('change', (s) => {
    if (s === 'background') leftAt = Date.now();
    else if (s === 'active' && state.enabled && leftAt && Date.now() - leftAt > GRACE_MS) set({ locked: true });
  });
}
