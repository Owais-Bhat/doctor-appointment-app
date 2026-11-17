import { View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import type { AppointmentStatus } from '@/lib/types';

import { Text } from './Text';

type Tone = 'accent' | 'good' | 'warn' | 'bad' | 'neutral';

export function Badge({ label, tone = 'accent' }: { label: string; tone?: Tone }) {
  const t = useTheme();
  const color = tone === 'neutral' ? t.ink2 : t[tone];
  return (
    <View style={{ alignSelf: 'flex-start', backgroundColor: `${color}26`, borderWidth: 1, borderColor: `${color}45`, paddingHorizontal: 11, paddingVertical: 5, borderRadius: 999 }}>
      <Text variant="small" style={{ color, fontWeight: '800', fontSize: 12 }}>
        {label}
      </Text>
    </View>
  );
}

const STATUS: Record<AppointmentStatus, { label: string; tone: Tone }> = {
  pending: { label: 'Awaiting doctor', tone: 'warn' },
  confirmed: { label: 'Confirmed', tone: 'good' },
  completed: { label: 'Completed', tone: 'accent' },
  cancelled: { label: 'Cancelled', tone: 'bad' },
  no_show: { label: 'Missed', tone: 'neutral' },
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const s = STATUS[status] ?? { label: status, tone: 'neutral' as Tone };
  return <Badge label={s.label} tone={s.tone} />;
}
