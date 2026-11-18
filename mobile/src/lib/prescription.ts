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

const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** The prescription as a one-page document for printing or saving as a PDF. Every value is escaped. */
export function prescriptionHtml(args: { doctor: string; specialty?: string | null; date: string; rx: Prescription; followUp?: string | null }): string {
  const { doctor, specialty, date, rx, followUp } = args;
  const items = rx.items
    .map((i) => `<li><b>${esc(itemLine(i))}</b>${i.note ? `<div class="note">${esc(i.note)}</div>` : ''}</li>`)
    .join('');
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{font-family:-apple-system,Roboto,Helvetica,Arial,sans-serif;color:#111;padding:32px;font-size:15px;line-height:1.5}
  h1{font-size:22px;margin:0 0 2px} .sub{color:#555;margin:0 0 18px}
  .head{border-bottom:2px solid #007AFF;padding-bottom:10px;margin-bottom:18px}
  ol{padding-left:22px} li{margin-bottom:12px} .note{color:#555;font-size:13px;margin-top:2px}
  .box{margin-top:18px} .label{font-size:12px;color:#555;text-transform:uppercase;letter-spacing:.06em}
  .foot{margin-top:36px;color:#888;font-size:12px}
</style></head><body>
  <div class="head"><h1>Prescription</h1><p class="sub">${esc(doctor)}${specialty ? ` · ${esc(specialty)}` : ''} · ${esc(formatDateLong(date))}</p></div>
  ${items ? `<ol>${items}</ol>` : ''}
  ${rx.advice ? `<div class="box"><div class="label">Advice</div><div>${esc(rx.advice).replace(/\n/g, '<br>')}</div></div>` : ''}
  ${followUp ? `<div class="box"><div class="label">Follow-up</div><div>${esc(formatDateLong(followUp))}</div></div>` : ''}
  <div class="foot">Issued through MedFlow. This prescription is valid only as written by the doctor above.</div>
</body></html>`;
}

/** A date `days` from today as YYYY-MM-DD, for the follow-up quick picks. */
export function inDays(days: number): string {
  const d = new Date();
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}
