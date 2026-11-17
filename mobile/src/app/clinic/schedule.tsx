import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Header } from '@/components/Header';
import { Icon } from '@/components/icons/Icon';
import { ErrorNote, ListSkeleton } from '@/components/States';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassChip } from '@/components/ui/GlassChip';
import { GlassSwitch } from '@/components/ui/GlassSwitch';
import { Reveal } from '@/components/ui/Reveal';
import { Screen } from '@/components/ui/Screen';
import { Tap } from '@/components/ui/Tap';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/use-theme';
import { api, ApiError } from '@/lib/api';
import { DAYS } from '@/lib/clinic';
import { formatDate, formatTime, hhmm, minutesOf, nextDays } from '@/lib/format';
import type { AvailabilityRow, BlockedDate } from '@/lib/types';
import { useApi } from '@/lib/use-api';

type Day = { enabled: boolean; start: number; end: number; duration: number };
const DEFAULT_DAY: Day = { enabled: false, start: 9 * 60, end: 17 * 60, duration: 30 };
const DURATIONS = [15, 20, 30, 45, 60];
const STEP = 30;

function Stepper({ label, value, onChange, min, max }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number }) {
  const t = useTheme();
  const btn = (delta: number, icon: 'plus' | 'chevronLeft') => (
    <Tap onPress={() => onChange(Math.max(min, Math.min(max, value + delta)))} label={`${label} ${delta < 0 ? 'earlier' : 'later'}`} hitSlop={6} scaleTo={0.85}>
      <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: t.glassStrong, borderWidth: 1, borderColor: t.edgeA }}>
        {icon === 'plus' ? <Icon name="plus" size={18} /> : <View style={{ width: 12, height: 2.4, borderRadius: 2, backgroundColor: t.ink }} />}
      </View>
    </Tap>
  );
  return (
    <View style={{ flex: 1, gap: 6 }}>
      <Text variant="small" tone="ink3" style={{ fontWeight: '700' }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        {btn(-STEP, 'chevronLeft')}
        <Text variant="bodyStrong" style={{ minWidth: 70, textAlign: 'center' }}>
          {formatTime(hhmm(value))}
        </Text>
        {btn(STEP, 'plus')}
      </View>
    </View>
  );
}

export default function Schedule() {
  const t = useTheme();
  const { data, loading, error, refreshing, refresh, reload } = useApi<{ availability: AvailabilityRow[]; blocked_dates: BlockedDate[] }>('/api/doctor/availability');
  // null = nothing edited yet; otherwise the unsaved week
  const [draft, setDraft] = useState<Day[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [offDate, setOffDate] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [adding, setAdding] = useState(false);
  const [offError, setOffError] = useState<string | null>(null);

  const fromServer = useMemo(() => {
    const week = Array.from({ length: 7 }, () => ({ ...DEFAULT_DAY }));
    for (const r of data?.availability ?? []) {
      if (r.day_of_week >= 0 && r.day_of_week <= 6) {
        week[r.day_of_week] = { enabled: r.is_active, start: minutesOf(r.start_time), end: minutesOf(r.end_time), duration: r.slot_duration_minutes || 30 };
      }
    }
    return week;
  }, [data]);
  const days = draft ?? fromServer;
  const dirty = draft !== null;

  const update = (i: number, patch: Partial<Day>) => {
    setDraft((d) => (d ?? fromServer).map((x, j) => (j === i ? { ...x, ...patch } : x)));
    setSaved(false);
  };

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const slots = days
        .map((d, i) => ({ d, i }))
        .filter(({ d }) => d.enabled)
        .map(({ d, i }) => ({ day_of_week: i, start_time: hhmm(d.start), end_time: hhmm(d.end), slot_duration_minutes: d.duration, is_active: true }));
      await api('/api/doctor/availability', { method: 'PUT', body: { slots } });
      setSaved(true);
      await refresh();
      setDraft(null);
    } catch (e) {
      setMessage(e instanceof ApiError ? e.message : 'Could not save your hours.');
    } finally {
      setSaving(false);
    }
  }

  const blocked = useMemo(() => data?.blocked_dates ?? [], [data]);
  const choices = useMemo(() => nextDays(45).filter((d) => !blocked.some((b) => b.blocked_date === d.ymd)), [blocked]);

  async function addOff() {
    if (!offDate) return;
    setAdding(true);
    setOffError(null);
    try {
      await api('/api/doctor/blocked-dates', { method: 'POST', body: { date: offDate, reason: reason.trim() || undefined } });
      setOffDate(null);
      setReason('');
      await refresh();
    } catch (e) {
      setOffError(e instanceof ApiError ? e.message : 'Could not add the day off.');
    } finally {
      setAdding(false);
    }
  }

  async function removeOff(id: string) {
    setOffError(null);
    try {
      await api(`/api/doctor/blocked-dates/${id}`, { method: 'DELETE' });
      await refresh();
    } catch (e) {
      setOffError(e instanceof ApiError ? e.message : 'Could not remove it.');
    }
  }

  return (
    <Screen tabs onRefresh={refresh} refreshing={refreshing}>
      <Reveal>
        <Header title="Weekly hours" subtitle="When patients can book you" />
      </Reveal>

      {loading ? (
        <ListSkeleton rows={3} />
      ) : error ? (
        <ErrorNote message={error} onRetry={reload} />
      ) : (
        <>
          <View style={{ gap: 12 }}>
            {days.map((d, i) => (
              <Reveal key={DAYS[i]} index={i}>
                <GlassCard padding={16}>
                  <View style={{ gap: 14 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View>
                        <Text variant="bodyStrong">{DAYS[i]}</Text>
                        <Text variant="small" tone="ink3">
                          {d.enabled ? `${formatTime(hhmm(d.start))} – ${formatTime(hhmm(d.end))}` : 'Day off'}
                        </Text>
                      </View>
                      <GlassSwitch value={d.enabled} onChange={(v) => update(i, { enabled: v })} label={`${DAYS[i]} open`} />
                    </View>
                    {d.enabled ? (
                      <View style={{ gap: 14 }}>
                        <View style={{ flexDirection: 'row', gap: 14 }}>
                          <Stepper label="Opens" value={d.start} min={0} max={d.end - STEP} onChange={(v) => update(i, { start: v })} />
                          <Stepper label="Closes" value={d.end} min={d.start + STEP} max={23 * 60 + 30} onChange={(v) => update(i, { end: v })} />
                        </View>
                        <View style={{ gap: 8 }}>
                          <Text variant="small" tone="ink3" style={{ fontWeight: '700' }}>
                            Minutes per visit
                          </Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                            {DURATIONS.map((m) => (
                              <GlassChip key={m} label={`${m} min`} selected={d.duration === m} height={38} onPress={() => update(i, { duration: m })} />
                            ))}
                          </ScrollView>
                        </View>
                      </View>
                    ) : null}
                  </View>
                </GlassCard>
              </Reveal>
            ))}
          </View>

          {message ? (
            <Text tone="bad" style={{ fontWeight: '600' }}>
              {message}
            </Text>
          ) : null}
          <Button title={saved && !dirty ? 'Saved' : 'Save hours'} icon="check" loading={saving} disabled={!dirty && !saving} onPress={save} />

          <Reveal style={{ gap: 12, marginTop: 8 }}>
            <Text variant="h2">Days off</Text>
            {blocked.length === 0 ? (
              <Text tone="ink2">No days off coming up.</Text>
            ) : (
              blocked.map((b) => (
                <GlassCard key={b.id} padding={14}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Icon name="calendar" size={24} />
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyStrong">{formatDate(b.blocked_date)}</Text>
                      {b.reason ? (
                        <Text variant="small" tone="ink2">
                          {b.reason}
                        </Text>
                      ) : null}
                    </View>
                    <Tap onPress={() => removeOff(b.id)} label="Remove day off" hitSlop={8} scaleTo={0.85}>
                      <Icon name="trash" size={22} color={t.bad} accent={t.bad} />
                    </Tap>
                  </View>
                </GlassCard>
              ))
            )}

            <GlassCard padding={16}>
              <View style={{ gap: 12 }}>
                <Text variant="bodyStrong">Add a day off</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 8 }}>
                  {choices.slice(0, 30).map((c) => (
                    <GlassChip key={c.ymd} label={`${c.day} ${c.date} ${c.month}`} selected={offDate === c.ymd} height={64} minWidth={58} onPress={() => setOffDate(c.ymd)}>
                      <View style={{ alignItems: 'center' }}>
                        <Text variant="small" style={{ fontWeight: '700', color: offDate === c.ymd ? '#fff' : t.ink3, fontSize: 11 }}>
                          {c.day}
                        </Text>
                        <Text variant="bodyStrong" style={{ color: offDate === c.ymd ? '#fff' : t.ink }}>
                          {c.date}
                        </Text>
                        <Text variant="small" style={{ fontSize: 10, color: offDate === c.ymd ? '#ffffffcc' : t.ink3 }}>
                          {c.month}
                        </Text>
                      </View>
                    </GlassChip>
                  ))}
                </ScrollView>
                <Field label="Reason (optional)" icon="fileText" value={reason} onChangeText={setReason} placeholder="e.g. Conference" maxLength={120} />
                {offError ? (
                  <Text variant="small" tone="bad" style={{ fontWeight: '600' }}>
                    {offError}
                  </Text>
                ) : null}
                <Button title="Add day off" variant="soft" icon="plus" disabled={!offDate} loading={adding} onPress={addOff} />
              </View>
            </GlassCard>
          </Reveal>
        </>
      )}
    </Screen>
  );
}
