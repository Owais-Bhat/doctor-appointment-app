import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { formatTime, parseDate } from '@/lib/format';
import { one, withDr, type Appointment } from '@/lib/types';

import { Icon } from './icons/Icon';
import { Button } from './ui/Button';
import { GlassCard } from './ui/GlassCard';
import { StatusBadge } from './ui/Badge';
import { Text } from './ui/Text';

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const TYPE_ICON = { video: 'video', phone: 'phone', in_person: 'hospital' } as const;
const TYPE_LABEL = { video: 'Video visit', phone: 'Phone call', in_person: 'In person' } as const;

type Props = { appointment: Appointment; onCancel?: (id: string) => Promise<void> | void; cancellable?: boolean };

export function AppointmentCard({ appointment: a, onCancel, cancellable = false }: Props) {
  const t = useTheme();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const doctor = a.doctor_profiles;
  const name = one(doctor?.profiles)?.full_name ?? 'Doctor';
  const d = parseDate(a.appointment_date);

  // The confirm prompt lapses after a few seconds instead of lingering
  useEffect(() => {
    if (!confirming) return;
    const id = setTimeout(() => setConfirming(false), 4000);
    return () => clearTimeout(id);
  }, [confirming]);

  return (
    <GlassCard padding={16}>
      <View style={{ gap: 14 }}>
        <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
          <View style={{ width: 54, height: 60, borderRadius: 16, backgroundColor: `${t.accent}18`, alignItems: 'center', justifyContent: 'center' }}>
            <Text variant="caption" tone="accent" style={{ fontSize: 10.5 }}>
              {MONTHS[d.getMonth()]}
            </Text>
            <Text variant="h2" tone="accent">
              {d.getDate()}
            </Text>
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text variant="bodyStrong" numberOfLines={1}>
              {withDr(name)}
            </Text>
            <Text variant="small" tone="ink2" numberOfLines={1}>
              {doctor?.specialty}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Icon name="clock" size={14} color={t.ink2} />
                <Text variant="small" tone="ink2">
                  {formatTime(a.appointment_time)}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Icon name={TYPE_ICON[a.consultation_type] ?? 'hospital'} size={14} color={t.ink2} />
                <Text variant="small" tone="ink2">
                  {TYPE_LABEL[a.consultation_type] ?? 'Visit'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <View style={{ flexDirection: 'row', gap: 8, flexShrink: 1, flexWrap: 'wrap' }}>
            <StatusBadge status={a.status} />
            {a.payment_status === 'paid' ? <PaidTag /> : null}
          </View>
          {cancellable && onCancel ? (
            <Button
              size="sm"
              variant={confirming ? 'danger' : 'ghost'}
              title={confirming ? 'Tap to confirm' : 'Cancel'}
              loading={busy}
              onPress={async () => {
                if (!confirming) return setConfirming(true);
                setBusy(true);
                try {
                  await onCancel(a.id);
                } finally {
                  setBusy(false);
                  setConfirming(false);
                }
              }}
            />
          ) : null}
        </View>
      </View>
    </GlassCard>
  );
}

function PaidTag() {
  const t = useTheme();
  return (
    <View style={{ alignSelf: 'flex-start', flexDirection: 'row', gap: 4, alignItems: 'center', backgroundColor: `${t.good}22`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
      <Icon name="check" size={12} color={t.good} accent={t.good} strokeWidth={2.6} />
      <Text variant="small" style={{ color: t.good, fontWeight: '700', fontSize: 12 }}>
        Paid
      </Text>
    </View>
  );
}
