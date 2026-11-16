import { TIME_ZONE } from './config';

/** Current clinic wall-clock time as "YYYY-MM-DD HH:MM" (what the server compares against). */
export function clinicNow(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}`;
}

/** Today's date in the clinic's time zone, "YYYY-MM-DD". */
export const clinicToday = (now = new Date()) => clinicNow(now).slice(0, 10);
