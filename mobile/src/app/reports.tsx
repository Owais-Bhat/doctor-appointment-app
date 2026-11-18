import { useState } from 'react';
import { View } from 'react-native';

import { Header } from '@/components/Header';
import { Icon } from '@/components/icons/Icon';
import { EmptyState, ErrorNote, ListSkeleton } from '@/components/States';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassChip } from '@/components/ui/GlassChip';
import { Reveal } from '@/components/ui/Reveal';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/lib/api';
import { deleteReport, openReport, pickPdf, pickPhoto, shareReportWith, uploadReport, type Picked, type Report } from '@/lib/files';
import { formatDate, formatTime } from '@/lib/format';
import { one, withDr, type Appointment } from '@/lib/types';
import { useApi } from '@/lib/use-api';

const kb = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
const errorText = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback);

/** Test results, scans and old prescriptions: upload them and share with a visit's doctor. */
export default function Reports() {
  const t = useTheme();
  const reports = useApi<{ reports: Report[] }>('/api/patient/reports');
  const visits = useApi<{ appointments: Appointment[] }>('/api/patient/appointments');
  const [title, setTitle] = useState('');
  const [shareWith, setShareWith] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [sharing, setSharing] = useState<string | null>(null);

  const usable = (visits.data?.appointments ?? []).filter((a) => ['pending', 'confirmed', 'completed'].includes(a.status)).slice(-8).reverse();
  const visitLabel = (a: Appointment) => `${formatDate(a.appointment_date)} ${formatTime(a.appointment_time)} · ${withDr(one(a.doctor_profiles?.profiles)?.full_name ?? 'Doctor')}`;

  async function run(key: string, fn: () => Promise<unknown>, ok?: string) {
    setBusy(key);
    setMessage(null);
    try {
      await fn();
      if (ok) setMessage({ ok: true, text: ok });
    } catch (e) {
      setMessage({ ok: false, text: e instanceof ApiError || e instanceof Error ? errorText(e, 'Something went wrong.') : 'Something went wrong.' });
    } finally {
      setBusy(null);
    }
  }

  const add = (pick: () => Promise<Picked | null>, key: string) =>
    run(key, async () => {
      const file = await pick();
      if (!file) return;
      await uploadReport(file, title, shareWith);
      setTitle('');
      await reports.refresh();
      setMessage({ ok: true, text: 'Uploaded.' });
    });

  return (
    <Screen onRefresh={() => void reports.refresh()} refreshing={reports.refreshing}>
      <Reveal>
        <Header title="My reports" back />
      </Reveal>

      <Reveal index={1}>
        <GlassCard padding={18}>
          <View style={{ gap: 14 }}>
            <Text variant="bodyStrong">Add a report</Text>
            <Field label="Name (optional)" icon="fileText" value={title} onChangeText={setTitle} placeholder="e.g. Blood test, March" maxLength={120} />
            {usable.length ? (
              <View style={{ gap: 8 }}>
                <Text variant="small" tone="ink2" style={{ marginLeft: 6, fontWeight: '700' }}>
                  Share with the doctor of…
                </Text>
                <View style={{ gap: 8 }}>
                  {usable.map((a) => (
                    <GlassChip key={a.id} label={visitLabel(a)} height={40} selected={shareWith === a.id} onPress={() => setShareWith(shareWith === a.id ? null : a.id)} />
                  ))}
                </View>
              </View>
            ) : null}
            <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
              <Button size="sm" icon="plus" title="Photo" loading={busy === 'photo'} disabled={!!busy} onPress={() => void add(() => pickPhoto(false), 'photo')} />
              <Button size="sm" variant="soft" icon="sparkles" title="Camera" loading={busy === 'camera'} disabled={!!busy} onPress={() => void add(() => pickPhoto(true), 'camera')} />
              <Button size="sm" variant="soft" icon="fileText" title="PDF" loading={busy === 'pdf'} disabled={!!busy} onPress={() => void add(pickPdf, 'pdf')} />
            </View>
            <Text variant="small" tone="ink3">
              Photos and PDFs up to 3 MB. Only the doctor of a visit you share a report with can open it.
            </Text>
          </View>
        </GlassCard>
      </Reveal>

      {message ? (
        <Text tone={message.ok ? 'good' : 'bad'} style={{ fontWeight: '600' }}>
          {message.text}
        </Text>
      ) : null}

      {reports.loading ? (
        <ListSkeleton rows={2} />
      ) : reports.error ? (
        <ErrorNote message={reports.error} onRetry={reports.reload} />
      ) : (reports.data?.reports.length ?? 0) === 0 ? (
        <EmptyState icon="fileText" title="No reports yet" body="Add a photo or PDF above and share it with your doctor before a visit." />
      ) : (
        <View style={{ gap: 12 }}>
          {reports.data?.reports.map((r, i) => {
            const shared = usable.find((a) => a.id === r.appointment_id);
            return (
              <Reveal key={r.id} index={i}>
                <GlassCard padding={16}>
                  <View style={{ gap: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <Icon name="fileText" size={26} color={t.accent} accent={t.accent} />
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text variant="bodyStrong" numberOfLines={1}>
                          {r.title}
                        </Text>
                        <Text variant="small" tone="ink3">
                          {kb(r.size_bytes)} · {r.mime_type === 'application/pdf' ? 'PDF' : 'Photo'} · {formatDate(r.created_at.slice(0, 10))}
                        </Text>
                        <Text variant="small" tone={r.appointment_id ? 'good' : 'ink3'} style={{ fontWeight: '600' }}>
                          {r.appointment_id ? `Shared · ${shared ? visitLabel(shared) : 'with a visit'}` : 'Not shared'}
                        </Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                      <Button size="sm" icon="search" title="Open" loading={busy === `open-${r.id}`} disabled={!!busy} onPress={() => void run(`open-${r.id}`, () => openReport(r))} />
                      <Button size="sm" variant="soft" title={r.appointment_id ? 'Stop sharing' : 'Share'} loading={busy === `share-${r.id}`} disabled={!!busy} onPress={() => (r.appointment_id ? void run(`share-${r.id}`, async () => { await shareReportWith(r.id, null); await reports.refresh(); }) : setSharing(sharing === r.id ? null : r.id))} />
                      <Button size="sm" variant="danger" icon="trash" title="Delete" loading={busy === `del-${r.id}`} disabled={!!busy} onPress={() => void run(`del-${r.id}`, async () => { await deleteReport(r.id); await reports.refresh(); })} />
                    </View>
                    {sharing === r.id ? (
                      <View style={{ gap: 8 }}>
                        {usable.length === 0 ? (
                          <Text variant="small" tone="ink3">
                            Book a visit first, then share this report with its doctor.
                          </Text>
                        ) : (
                          usable.map((a) => (
                            <GlassChip key={a.id} label={visitLabel(a)} height={40} onPress={() => { setSharing(null); void run(`share-${r.id}`, async () => { await shareReportWith(r.id, a.id); await reports.refresh(); }, 'Shared with the doctor.'); }} />
                          ))
                        )}
                      </View>
                    ) : null}
                  </View>
                </GlassCard>
              </Reveal>
            );
          })}
        </View>
      )}
    </Screen>
  );
}
