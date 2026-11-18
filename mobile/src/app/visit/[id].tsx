import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, Share, View } from 'react-native';

import { PrescriptionEditor } from '@/components/clinic/PrescriptionEditor';
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
import { openReport } from '@/lib/files';
import { savePrescription, saveVisitNotes, setVisitStatus, type NextStatus } from '@/lib/clinic';
import { ageFromDob, formatDate, formatDateLong, formatTime } from '@/lib/format';
import { itemLine, prescriptionText } from '@/lib/prescription';
import { withDr, type AppointmentStatus, type Intake, type Prescription } from '@/lib/types';
import { useApi } from '@/lib/use-api';
import { joinVideoVisit } from '@/lib/video';

type Visit = {
  role: 'doctor' | 'patient';
  join: { ok: boolean; reason?: string };
  visit: { id: string; date: string; time: string; status: AppointmentStatus; paymentStatus: string; type: 'video' | 'phone' | 'in_person'; reason: string | null; notes?: string | null; intake?: Intake | null; prescription: Prescription | null; followUpDate: string | null };
  doctor?: { name: string; specialty: string | null };
  reports?: { id: string; title: string; mime_type: string }[];
  patient: { full_name: string; date_of_birth?: string | null; blood_type?: string | null; phone?: string | null } | null;
};

type IntakeKey = 'duration' | 'severity' | 'medications' | 'allergies';
const INTAKE_LABEL: Record<IntakeKey, string> = { duration: 'How long', severity: 'How bad', medications: 'Taking', allergies: 'Allergies' };

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

  // The patient sees their own prescription, not the doctor's working screen
  if (data?.role === 'patient') return <PatientVisit data={data} />;

  const canPrescribe = v?.status === 'confirmed' || v?.status === 'completed';

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

          {v.intake?.booked_for ? (
            <Reveal index={2}>
              <GlassCard padding={18}>
                <View style={{ gap: 4 }}>
                  <Text variant="bodyStrong">Visit is for {v.intake.booked_for.full_name}</Text>
                  <Text variant="small" tone="ink2">
                    {[v.intake.booked_for.relation ? `${v.intake.booked_for.relation} of ${patient?.full_name ?? 'the account holder'}` : `Booked by ${patient?.full_name ?? 'the account holder'}`, v.intake.booked_for.date_of_birth, v.intake.booked_for.gender, v.intake.booked_for.blood_type ? `Blood ${v.intake.booked_for.blood_type}` : null].filter(Boolean).join(' · ')}
                  </Text>
                </View>
              </GlassCard>
            </Reveal>
          ) : null}

          {v.reason || v.intake ? (
            <Reveal index={2}>
              <GlassCard padding={18}>
                <View style={{ gap: 10 }}>
                  <Text variant="bodyStrong">What the patient said</Text>
                  {v.reason ? <Text tone="ink2">“{v.reason}”</Text> : null}
                  {v.intake
                    ? (Object.keys(INTAKE_LABEL) as IntakeKey[])
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

          {data?.reports?.length ? (
            <Reveal index={3}>
              <GlassCard padding={18}>
                <View style={{ gap: 10 }}>
                  <Text variant="bodyStrong">Reports shared by the patient</Text>
                  {data.reports.map((r) => (
                    <Button key={r.id} size="sm" variant="soft" icon="fileText" title={r.title} disabled={!!busy} onPress={() => void openReport(r).catch((e: unknown) => setMessage({ ok: false, text: e instanceof Error ? e.message : 'Could not open this report.' }))} style={{ alignSelf: 'flex-start' }} />
                  ))}
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

          {canPrescribe ? (
            <Reveal index={4}>
              <PrescriptionEditor
                saved={v.prescription}
                savedFollowUp={v.followUpDate}
                saving={busy === 'rx'}
                onSave={(rx, followUp) => void run('rx', () => savePrescription(id, rx, followUp), rx ? 'Prescription saved. The patient can see it now.' : 'Prescription cleared.')}
              />
            </Reveal>
          ) : null}

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

/** A patient's view of one visit: who saw them, and the prescription. */
function PatientVisit({ data }: { data: Visit }) {
  const t = useTheme();
  const { visit: v, doctor } = data;
  const rx = v.prescription;
  const doctorName = withDr(doctor?.name ?? 'your doctor');

  return (
    <Screen>
      <Reveal>
        <Header title="Your visit" back />
      </Reveal>
      <Reveal index={1}>
        <GlassCard padding={18}>
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <Avatar name={doctor?.name ?? 'Doctor'} size={54} />
              <View style={{ flex: 1, gap: 3 }}>
                <Text variant="h2" numberOfLines={1}>
                  {doctorName}
                </Text>
                <Text variant="small" tone="ink2">
                  {[doctor?.specialty, `${formatDate(v.date)} · ${formatTime(v.time)}`].filter(Boolean).join(' · ')}
                </Text>
              </View>
              <StatusBadge status={v.status} />
            </View>
          </View>
        </GlassCard>
      </Reveal>

      {rx ? (
        <Reveal index={2}>
          <GlassCard padding={18}>
            <View style={{ gap: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Icon name="pill" size={22} color={t.accent} accent={t.accent} />
                <Text variant="bodyStrong">Prescription</Text>
              </View>
              {rx.items.map((i, n) => (
                <View key={n} style={{ flexDirection: 'row', gap: 12 }}>
                  <Text variant="bodyStrong" tone="accent" style={{ width: 22 }}>
                    {n + 1}.
                  </Text>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="bodyStrong">{itemLine(i)}</Text>
                    {i.note ? (
                      <Text variant="small" tone="ink2">
                        {i.note}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))}
              {rx.advice ? (
                <View style={{ gap: 4 }}>
                  <Text variant="small" tone="ink3" style={{ fontWeight: '700' }}>
                    Advice
                  </Text>
                  <Text>{rx.advice}</Text>
                </View>
              ) : null}
              {v.followUpDate ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Icon name="calendar" size={18} color={t.accent} accent={t.accent} />
                  <Text variant="small" style={{ fontWeight: '700' }}>
                    Follow-up: {formatDateLong(v.followUpDate)}
                  </Text>
                </View>
              ) : null}
              <Button
                title="Share prescription"
                icon="fileText"
                variant="soft"
                onPress={() => void Share.share({ message: prescriptionText({ doctor: doctorName, specialty: doctor?.specialty, date: v.date, rx, followUp: v.followUpDate }) })}
              />
            </View>
          </GlassCard>
        </Reveal>
      ) : (
        <EmptyState icon="pill" title="No prescription yet" body="If your doctor writes one after the visit, it appears here and you get a notification." />
      )}
    </Screen>
  );
}
