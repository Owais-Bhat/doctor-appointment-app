import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { formatMoney, formatTime, parseDate } from '@/lib/format';
import type { PaymentState } from '@/lib/payments';
import { one, withDr, type Appointment } from '@/lib/types';

import { Icon } from './icons/Icon';
import { StatusBadge } from './ui/Badge';
import { Button } from './ui/Button';
import { GlassCard } from './ui/GlassCard';
import { Text } from './ui/Text';

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const TYPE_ICON = { video: 'video', phone: 'phone', in_person: 'hospital' } as const;
const TYPE_LABEL = { video: 'Video visit', phone: 'Phone call', in_person: 'In person' } as const;

type Props = {
  appointment: Appointment;
  payment?: PaymentState | null;
  /** Upcoming visits can be cancelled, paid for and joined. */
  cancellable?: boolean;
  onCancel?: (id: string) => Promise<void> | void;
  onPay?: (id: string) => void;
  paying?: boolean;
  /** The video room is open now (see canJoinVideo). */
  canJoin?: boolean;
  onJoin?: (id: string) => void;
  joining?: boolean;
  /** Something that went wrong with this visit's payment or video room. */
  error?: string | null;
};

export function AppointmentCard({ appointment: a, payment, cancellable = false, onCancel, onPay, paying, canJoin, onJoin, joining, error }: Props) {
  const t = useTheme();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const doctor = a.doctor_profiles;
  const name = one(doctor?.profiles)?.full_name ?? 'Doctor';
  const d = parseDate(a.appointment_date);

  const due = payment?.kind === 'due';
  const showPay = cancellable && due && !!onPay;
  // A video visit is paid for before its room opens
  const showJoin = cancellable && !!canJoin && !due && !!onJoin;
  const waitingForRoom = cancellable && a.consultation_type === 'video' && a.status === 'confirmed' && !canJoin;

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

        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <StatusBadge status={a.status} />
          {payment ? <PaymentTag state={payment} /> : null}
        </View>

        {waitingForRoom && !due ? (
          <Text variant="small" tone="ink3">
            The video room opens 15 minutes before your visit.
          </Text>
        ) : null}
        {error ? (
          <Text variant="small" tone="bad" style={{ fontWeight: '600' }}>
            {error}
          </Text>
        ) : null}

        {a.has_prescription || (a.status === 'completed' && !a.reviewed) ? (
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {a.status === 'completed' && !a.reviewed ? (
              <Button size="sm" icon="star" variant="ghost" title="Rate visit" onPress={() => router.push({ pathname: '/rate/[id]', params: { id: a.id } })} />
            ) : null}
            {a.has_prescription ? (
              <Button size="sm" icon="pill" variant="soft" title="View prescription" onPress={() => router.push({ pathname: '/visit/[id]', params: { id: a.id } })} />
            ) : null}
          </View>
        ) : null}

        {cancellable && (showPay || showJoin || onCancel) ? (
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' }}>
            {onCancel ? (
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
            {showPay ? (
              <Button size="sm" icon="wallet" title={`Pay ${formatMoney(Number(doctor?.consultation_fee ?? 0))}`} loading={paying} onPress={() => onPay?.(a.id)} />
            ) : null}
            {showJoin ? <Button size="sm" icon="video" title="Join video" loading={joining} onPress={() => onJoin?.(a.id)} /> : null}
          </View>
        ) : null}
      </View>
    </GlassCard>
  );
}

function PaymentTag({ state }: { state: PaymentState }) {
  const t = useTheme();
  const settled = state.kind === 'paid' || state.kind === 'waived';
  const color = settled ? t.good : state.kind === 'due' ? t.warn : t.ink2;
  return (
    <View style={{ alignSelf: 'flex-start', flexDirection: 'row', gap: 5, alignItems: 'center', backgroundColor: `${color}22`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
      <Icon name={settled ? 'check' : 'wallet'} size={12} color={color} accent={color} strokeWidth={settled ? 2.6 : 2} />
      <Text variant="small" style={{ color, fontWeight: '700', fontSize: 12 }}>
        {state.label}
      </Text>
    </View>
  );
}
