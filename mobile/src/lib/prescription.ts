import { formatDateLong } from './format';
import type { Prescription, PrescriptionItem } from './types';

export const emptyItem = (): PrescriptionItem => ({ name: '', dose: '', frequency: '', duration: '', note: '' });

/** Common ways to write how often, so a doctor taps instead of types. */
export const FREQUENCIES = ['Once a day', 'Twice a day', '3 times a day', 'At night', 'When needed'] as const;

/** One medicine as a single readable line: "Paracetamol 500 mg — twice a day for 5 days". */
export function itemLine(i: PrescriptionItem): string {
  const how = [i.frequency, i.duration ? `for ${i.duration}` : ''].filter(Boolean).join(' ');
  return [[i.name, i.dose].filter(Boolean).join(' '), how].filter(Boolean).join(' — ');
}

/** The prescription as plain text, for sharing in WhatsApp, SMS or email. */
export function prescriptionText(args: { doctor: string; specialty?: string | null; date: string; rx: Prescription; followUp?: string | null }): string {
  const { doctor, specialty, date, rx, followUp } = args;
  const lines = [`Prescription — ${doctor}${specialty ? ` (${specialty})` : ''}`, `Visit: ${formatDateLong(date)}`, ''];
  rx.items.forEach((i, n) => {
    lines.push(`${n + 1}. ${itemLine(i)}`);
    if (i.note) lines.push(`   ${i.note}`);
  });
  if (rx.advice) lines.push('', 'Advice:', rx.advice);
  if (followUp) lines.push('', `Follow-up: ${formatDateLong(followUp)}`);
  lines.push('', 'Sent from MedFlow');
  return lines.join('\n');
}
