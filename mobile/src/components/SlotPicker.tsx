import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { formatTime, nextDays } from '@/lib/format';
import { useApi } from '@/lib/use-api';

import { ErrorNote } from './States';
import { GlassCard } from './ui/GlassCard';
import { GlassChip } from './ui/GlassChip';
import { Skeleton } from './ui/Skeleton';
import { Text } from './ui/Text';

type Props = {
  doctorId: string;
  date: string;
  time: string | null;
  onChange: (date: string, time: string | null) => void;
};

/** Two weeks of days and, for the chosen day, the doctor's open times. */
export function SlotPicker({ doctorId, date, time, onChange }: Props) {
  const t = useTheme();
  const days = useMemo(() => nextDays(14), []);
  const slots = useApi<{ slots: string[] }>(`/api/doctors/${doctorId}/slots?date=${date}`, { auth: false });

  return (
    <View style={{ gap: 18 }}>
      <View style={{ gap: 12 }}>
        <Text variant="h2">Pick a day</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 8 }}>
          {days.map((day) => {
            const on = day.ymd === date;
            return (
              <GlassChip key={day.ymd} label={`${day.day} ${day.date} ${day.month}`} selected={on} height={84} minWidth={66} onPress={() => onChange(day.ymd, null)}>
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
      </View>

      <View style={{ gap: 12 }}>
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
            {slots.data?.slots.map((s) => (
              <GlassChip key={s} label={formatTime(s)} selected={s === time} minWidth={92} onPress={() => onChange(date, s)} />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
