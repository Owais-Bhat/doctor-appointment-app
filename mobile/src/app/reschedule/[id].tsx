import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { Header } from '@/components/Header';
import { SlotPicker } from '@/components/SlotPicker';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Reveal } from '@/components/ui/Reveal';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { ApiError, api } from '@/lib/api';
import { formatDate, formatTime, nextDays } from '@/lib/format';

/** Move a visit to another open time with the same doctor. The status and any payment stay. */
export default function Reschedule() {
  const { id, doctorId, date: currentDate, time: currentTime } = useLocalSearchParams<{ id: string; doctorId: string; date: string; time: string }>();
  const days = useMemo(() => nextDays(14), []);
  const [date, setDate] = useState(days[0].ymd);
  const [time, setTime] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function move() {
    if (!time) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/api/patient/appointments/${id}/reschedule`, { method: 'POST', body: { date, time } });
      router.back();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not move this visit.');
      // Someone may have just taken the slot
      if (e instanceof ApiError && e.status === 409) setTime(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Reveal>
        <Header title="Reschedule" back />
      </Reveal>
      {currentDate && currentTime ? (
        <Reveal index={1}>
          <GlassCard padding={16}>
            <Text variant="small" tone="ink3" style={{ fontWeight: '700' }}>
              Current time
            </Text>
            <Text variant="bodyStrong">
              {formatDate(currentDate)} · {formatTime(currentTime)}
            </Text>
          </GlassCard>
        </Reveal>
      ) : null}
      <Reveal index={2}>
        <SlotPicker
          doctorId={doctorId}
          date={date}
          time={time}
          onChange={(d, t) => {
            setDate(d);
            setTime(t);
          }}
        />
      </Reveal>
      {error ? (
        <Text tone="bad" style={{ fontWeight: '600' }}>
          {error}
        </Text>
      ) : null}
      <View>
        <Button title={time ? `Move to ${formatTime(time)} · ${formatDate(date)}` : 'Choose a new time'} icon="calendar" disabled={!time} loading={busy} onPress={() => void move()} />
      </View>
    </Screen>
  );
}
