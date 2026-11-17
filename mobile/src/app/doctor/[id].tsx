import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

import { Header } from '@/components/Header';
import { Icon } from '@/components/icons/Icon';
import { specialtyIcon } from '@/components/icons/paths';
import { EmptyState, ErrorNote } from '@/components/States';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassChip } from '@/components/ui/GlassChip';
import { GlossCard } from '@/components/ui/GlossCard';
import { Reveal } from '@/components/ui/Reveal';
import { Screen } from '@/components/ui/Screen';
import { Segmented } from '@/components/ui/Segmented';
import { Skeleton } from '@/components/ui/Skeleton';
import { SuccessCheck } from '@/components/ui/SuccessCheck';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/use-theme';
import { api, ApiError } from '@/lib/api';
import { CONSULTATION_TYPES, type ConsultationType } from '@/lib/config';
import { formatDate, formatMoney, formatTime, nextDays } from '@/lib/format';
import { doctorName, one, withDr, type Doctor } from '@/lib/types';
import { useApi } from '@/lib/use-api';

export default function DoctorScreen() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const doctor = useApi<{ doctor: Doctor }>(`/api/doctors/${id}`, { auth: false });

  const days = useMemo(() => nextDays(14), []);
  const [date, setDate] = useState(days[0].ymd);
  const [time, setTime] = useState<string | null>(null);
  const [type, setType] = useState<ConsultationType>('in_person');
  const [complaint, setComplaint] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booked, setBooked] = useState<{ date: string; time: string } | null>(null);

  const slots = useApi<{ slots: string[] }>(`/api/doctors/${id}/slots?date=${date}`, { auth: false });

  const d = doctor.data?.doctor;
  const name = d ? doctorName(d) : '';

  async function book() {
    if (!time) return;
    setError(null);
    setBusy(true);
    try {
      await api('/api/appointments', {
        method: 'POST',
        body: { doctorId: id, date, time, consultationType: type, chiefComplaint: complaint.trim() || undefined },
      });
      setBooked({ date, time });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not book this visit.');
      // Someone may have just taken the slot
      if (e instanceof ApiError && e.status === 409) {
        setTime(null);
        void slots.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  if (booked) {
    return (
      <Screen scroll={false} contentStyle={{ justifyContent: 'center', alignItems: 'center', gap: 18 }}>
        <SuccessCheck size={132} />
        <Reveal index={3} style={{ alignItems: 'center', gap: 8 }}>
          <Text variant="title" style={{ textAlign: 'center' }}>
            Request sent
          </Text>
          <Text tone="ink2" style={{ textAlign: 'center', maxWidth: 320 }}>
            {formatDate(booked.date)} at {formatTime(booked.time)} with {withDr(name)}. You’ll get a notification as soon as the doctor confirms, and can pay then.
          </Text>
        </Reveal>
        <Reveal index={5} style={{ width: '100%', gap: 10 }}>
          <Button title="View my visits" icon="calendar" onPress={() => router.replace('/visits')} />
          <Button title="Back to doctors" variant="ghost" onPress={() => router.replace('/doctors')} />
        </Reveal>
      </Screen>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <Reveal>
          <Header title="Book a visit" back />
        </Reveal>

        {doctor.loading ? (
          <Skeleton height={180} radius={28} />
        ) : doctor.error || !d ? (
          doctor.error ? <ErrorNote message={doctor.error} onRetry={doctor.reload} /> : <EmptyState icon="stethoscope" title="Doctor not found" />
        ) : (
          <>
            <Reveal index={1}>
              <GlossCard padding={20}>
                <View style={{ gap: 16 }}>
                <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
                  <Avatar name={name} uri={one(d.profiles)?.avatar_url} size={72} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text variant="h2" tone="onAccent" numberOfLines={2}>
                      {withDr(name)}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Icon name={specialtyIcon(d.specialty)} size={16} color="#fff" accent="#fff" />
                      <Text tone="onAccent" style={{ opacity: 0.9 }}>
                        {d.specialty}
                      </Text>
                    </View>
                    {d.clinic_name ? (
                      <Text variant="small" tone="onAccent" style={{ opacity: 0.8 }} numberOfLines={1}>
                        {d.clinic_name}
                      </Text>
                    ) : null}
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Stat label="Experience" value={d.experience_years != null ? `${d.experience_years} yrs` : '—'} />
                  <Stat label="Rating" value={d.total_reviews > 0 ? `${d.rating.toFixed(1)} ★` : 'New'} />
                  <Stat label="Fee" value={formatMoney(d.consultation_fee)} />
                </View>
                </View>
              </GlossCard>
            </Reveal>

            {d.bio ? (
              <Reveal index={2}>
                <GlassCard padding={18}>
                  <View style={{ gap: 6 }}>
                    <Text variant="bodyStrong">About</Text>
                    <Text tone="ink2">{d.bio}</Text>
                    {d.registration_number ? (
                      <Text variant="small" tone="ink3" style={{ marginTop: 4 }}>
                        Reg. no. {d.registration_number}
                        {d.registration_council ? ` · ${d.registration_council}` : ''}
                      </Text>
                    ) : null}
                  </View>
                </GlassCard>
              </Reveal>
            ) : null}

            <Reveal index={3} style={{ gap: 12 }}>
              <Text variant="h2">Pick a day</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 8 }}>
                {days.map((day) => {
                  const on = day.ymd === date;
                  return (
                    <GlassChip
                      key={day.ymd}
                      label={`${day.day} ${day.date} ${day.month}`}
                      selected={on}
                      height={84}
                      minWidth={66}
                      onPress={() => {
                        setDate(day.ymd);
                        setTime(null);
                      }}>
                      <View style={{ alignItems: 'center', gap: 2 }}>
                        <Text variant="small" style={{ fontWeight: '700', color: on ? '#fff' : t.ink3 }}>
                          {day.day}
                        </Text>
                        <Text variant="h2" style={{ color: on ? '#fff' : t.ink }}>
                          {day.date}
                        </Text>
                        <Text variant="small" style={{ fontSize: 11, color: on ? '#ffffffcc' : t.ink3 }}>
                          {day.month}
                        </Text>
                      </View>
                    </GlassChip>
                  );
                })}
              </ScrollView>
            </Reveal>

            <Reveal index={4} style={{ gap: 12 }}>
              <Text variant="h2">Pick a time</Text>
              {slots.loading ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {Array.from({ length: 6 }, (_, i) => (
                    <Skeleton key={i} width={86} height={44} radius={16} />
                  ))}
                </View>
              ) : slots.error ? (
                <ErrorNote message={slots.error} onRetry={slots.reload} />
              ) : (slots.data?.slots.length ?? 0) === 0 ? (
                <GlassCard padding={16}>
                  <Text tone="ink2">No free slots on this day. Try another date.</Text>
                </GlassCard>
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {slots.data?.slots.map((s, i) => {
                    const on = s === time;
                    return (
                      <Reveal key={s} index={Math.floor(i / 2)}>
                        <GlassChip label={formatTime(s)} selected={on} minWidth={92} onPress={() => setTime(s)} />
                      </Reveal>
                    );
                  })}
                </View>
              )}
            </Reveal>

            <Reveal index={5} style={{ gap: 12 }}>
              <Text variant="h2">How would you like to meet?</Text>
              <Segmented
                value={type}
                onChange={setType}
                options={CONSULTATION_TYPES.map((c) => ({ value: c.value, label: c.label, icon: c.icon }))}
              />
              <Field label="What’s it about? (optional)" icon="fileText" value={complaint} onChangeText={setComplaint} placeholder="e.g. headache for three days" multiline maxLength={500} />
            </Reveal>

            {error ? (
              <Text tone="bad" style={{ fontWeight: '600' }}>
                {error}
              </Text>
            ) : null}
            <Reveal index={6}>
              <Button
                title={time ? `Request ${formatTime(time)} · ${formatDate(date)}` : 'Choose a time to continue'}
                icon="calendarPlus"
                disabled={!time}
                loading={busy}
                onPress={book}
              />
            </Reveal>
          </>
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 16, paddingVertical: 10, alignItems: 'center', gap: 2 }}>
      <Text variant="bodyStrong" tone="onAccent">
        {value}
      </Text>
      <Text variant="small" tone="onAccent" style={{ opacity: 0.8, fontSize: 11.5 }}>
        {label}
      </Text>
    </View>
  );
}
