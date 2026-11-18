import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { API_URL } from './config';

let sent = 0;

/**
 * Tell the server a screen crashed, so it appears in the server log. No sign-in,
 * no account, no health data: just the error, where it happened and the app
 * version. At most 5 reports per app launch, and a failure here is ignored.
 */
export function reportError(error: unknown, where: string): void {
  if (sent >= 5) return;
  sent += 1;
  const e = error instanceof Error ? error : new Error(String(error));
  void fetch(`${API_URL}/api/diagnostics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: e.message, stack: e.stack, where, version: Constants.expoConfig?.version, platform: Platform.OS }),
  }).catch(() => undefined);
}
