import * as WebBrowser from 'expo-web-browser';

import { api } from './api';
import { clinicNow } from './clinic-time';

/** Minutes since the epoch for a clinic wall-clock date and time (only used to compare two of them). */
function wallMinutes(ymd: string, hhmm: string): number {
  const [y, m, d] = ymd.split('-').map(Number);
  const [h, min] = hhmm.split(':').map(Number);
  return Date.UTC(y, m - 1, d, h, min) / 60_000;
}

/**
 * Whether to offer "Join video": from 15 minutes before the visit until the
 * end of that day, in the clinic's time zone. The server enforces the same
 * window (and payment) when the room link is requested.
 */
export function canJoinVideo(date: string, time: string, now = new Date()): boolean {
  const [today, clock] = clinicNow(now).split(' ');
  const current = wallMinutes(today, clock);
  return current >= wallMinutes(date, time.slice(0, 5)) - 15 && current <= wallMinutes(date, '23:59');
}

/**
 * Ask the server for this visit's private room link and open it in the
 * phone's in-app browser, which handles the camera and microphone prompts.
 * Throws an ApiError with the server's reason (not open yet, unpaid, ended…).
 */
export async function joinVideoVisit(appointmentId: string, controlsColor?: string): Promise<void> {
  const { url } = await api<{ url: string }>(`/api/visits/${appointmentId}/join`, { method: 'POST' });
  if (!/^https:\/\//i.test(url)) throw new Error('The video room could not be opened.');
  await WebBrowser.openBrowserAsync(url, { controlsColor, dismissButtonStyle: 'close', enableBarCollapsing: true });
}
