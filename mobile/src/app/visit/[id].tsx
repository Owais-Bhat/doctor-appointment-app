import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, View } from 'react-native';

import { Header } from '@/components/Header';
import { Icon } from '@/components/icons/Icon';
import { EmptyState, ErrorNote, ListSkeleton } from '@/components/States';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { GlassCard } from '@/components/ui/GlassCard';
import { Reveal } from '@/components/ui/Reveal';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/lib/api';
import { saveVisitNotes, setVisitStatus, type NextStatus } from '@/lib/clinic';
import { ageFromDob, formatDate, formatTime } from '@/lib/format';
import type { AppointmentStatus, Intake } from '@/lib/types';
import { useApi } from '@/lib/use-api';
import { joinVideoVisit } from '@/lib/video';

type Visit = {
  role: 'doctor' | 'patient';
  join: { ok: boolean; reason?: string };
  visit: { id: string; date: string; time: string; status: AppointmentStatus; paymentStatus: string; type: 'video' | 'phone' | 'in_person'; reason: string | null; notes?: string | null; intake?: Intake | null };
  patient: { full_name: string; date_of_birth?: string | null; blood_type?: string | null; phone?: string | null } | null;
};

const INTAKE_LABEL: Record<keyof Intake, string> = { duration: 'How long', severity: 'How bad', medications: 'Taking', allergies: 'Allergies' };

/** One visit for the doctor: the patient, what they told us, notes, and the next step. */
export default function VisitScreen() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading, error, reload, refresh } = useApi<Visit>(`/api/visits/${id}`);
  // null = untouched; otherwise what the doctor typed
  const [typed, setTyped] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const v = data?.visit;
  const notes = typed ?? v?.notes ?? '';
  const notesChanged = typed !== null && typed.trim() !== (v?.notes ?? '').trim();
  const patient = data?.patient;
  const age = ageFromDob(patient?.date_of_birth);
  const open = v?.status === 'pending' || v?.status === 'confirmed';

  async function run(key: string, fn: () => Promise<unknown>, ok: string) {
    setBusy(key);
    setMessage(null);
    try {
      await fn();
      setMessage({ ok: true, text: ok });
      await refresh();
      setTyped(null);
    } catch (e) {
      setMessage({ ok: false, text: e instanceof ApiError ? e.message : 'Something went wrong.' });
    } finally {
      setBusy(null);
    }
  }

  const act = (status: NextStatus, ok: string) =>
    run(status, async () => {
      // Notes typed before finishing the visit are saved with it
      if (status === 'completed' && notes.trim() !== (v?.notes ?? '').trim()) await saveVisitNotes(id, notes.trim());
      await setVisitStatus(id, status);
    }, ok);

  return (
    <Screen>
      <Reveal>
        <Header title="Visit" back />
      </Reveal>

      {loading ? (
        <ListSkeleton rows={2} />
      ) : error || !v ? (
        error ? <ErrorNote message={error} onRetry={reload} /> : <EmptyState icon="calendar" title="Visit not found" />
      ) : (
        <>
          <Reveal index={1}>
            <GlassCard padding={18}>
              <View style={{ gap: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <Avatar name={patient?.full_name ?? 'Patient'} size={58} />
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text variant="h2" numberOfLines={1}>
                      {patient?.full_name ?? 'Patient'}
                    </Text>
                    <Text variant="small" tone="ink2">
                      {[age != null ? `${age} years` : null, patient?.blood_type ? `Blood ${patient.blood_type}` : null].filter(Boolean).join(' · ') || 'No health details yet'}
                    </Text>
                  </View>
                  <StatusBadge status={v.status} />
                </View>
                <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Icon name="calendar" size={16} color={t.ink2} />
                    <Text variant="small" tone="ink2">
                      {formatDate(v.date)} · {formatTime(v.time)}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Icon name={v.type === 'video' ? 'video' : v.type === 'phone' ? 'phone' : 'hospital'} size={16} color={t.ink2} />
                    <Text variant="small" tone="ink2">
                      {v.type === 'video' ? 'Video visit' : v.type === 'phone' ? 'Phone call' : 'In person'}
                    </Text>
                  </View>
                </View>
                {patient?.phone ? <Button title={`Call ${patient.phone}`} icon="phone" variant="soft" size="sm" onPress={() => Linking.openURL(`tel:${patient.phone}`)} style={{ alignSelf: 'flex-start' }} /> : null}
              </View>
            </GlassCard>
          </Reveal>

          {v.reason || v.intake ? (
            <Reveal index={2}>
              <GlassCard padding={18}>
                <View style={{ gap: 10 }}>
                  <Text variant="bodyStrong">What the patient said</Text>
                  {v.reason ? <Text tone="ink2">“{v.reason}”</Text> : null}
                  {v.intake
                    ? (Object.keys(INTAKE_LABEL) as (keyof Intake)[])
                        .filter((k) => v.intake?.[k])
                        .map((k) => (
                          <View key={k} style={{ flexDirection: 'row', gap: 10 }}>
                            <Text variant="small" tone="ink3" style={{ width: 78, fontWeight: '700' }}>
                              {INTAKE_LABEL[k]}
                            </Text>
                            <Text variant="small" style={{ flex: 1 }}>
                              {String(v.intake?.[k])}
                            </Text>
                          </View>
                        ))
                    : null}
                </View>
              </GlassCard>
            </Reveal>
          ) : null}

          <Reveal index={3}>
            <GlassCard padding={18}>
              <View style={{ gap: 12 }}>
                <Field label="Visit notes" icon="fileText" value={notes} onChangeText={setTyped} multiline maxLength={4000} placeholder="Findings, advice, prescription…" />
                <Button title="Save notes" variant="soft" icon="check" size="sm" loading={busy === 'notes'} disabled={!!busy || !notesChanged} onPress={() => run('notes', () => saveVisitNotes(id, notes.trim()), 'Notes saved.')} style={{ alignSelf: 'flex-start' }} />
              </View>
            </GlassCard>
          </Reveal>

          {message ? (
            <Text tone={message.ok ? 'good' : 'bad'} style={{ fontWeight: '600' }}>
              {message.text}
            </Text>
          ) : null}

          {open ? (
            <Reveal index={4} style={{ gap: 10 }}>
              {v.status === 'confirmed' && v.type === 'video' && data?.join.ok ? (
                <Button title="Join video visit" icon="video" loading={busy === 'join'} disabled={!!busy} onPress={() => run('join', () => joinVideoVisit(id, t.accent), 'Opened the video room.')} />
              ) : null}
              {v.status === 'pending' ? (
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Button title="Decline" variant="danger" style={{ flex: 1 }} loading={busy === 'cancelled'} disabled={!!busy} onPress={() => act('cancelled', 'Visit declined.')} />
                  <Button title="Confirm" icon="check" style={{ flex: 1 }} loading={busy === 'confirmed'} disabled={!!busy} onPress={() => act('confirmed', 'Visit confirmed.')} />
                </View>
              ) : (
                <>
                  <Button title="Complete visit" icon="check" loading={busy === 'completed'} disabled={!!busy} onPress={() => act('completed', 'Visit completed.')} />
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <Button title="Mark no-show" variant="ghost" style={{ flex: 1 }} loading={busy === 'no_show'} disabled={!!busy} onPress={() => act('no_show', 'Marked as not attending.')} />
                    <Button title="Cancel visit" variant="danger" style={{ flex: 1 }} loading={busy === 'cancelled'} disabled={!!busy} onPress={() => act('cancelled', 'Visit cancelled.')} />
                  </View>
                </>
              )}
            </Reveal>
          ) : null}
        </>
      )}
    </Screen>
  );
}
