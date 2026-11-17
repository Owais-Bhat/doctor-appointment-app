import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, View } from 'react-native';

import { Icon } from '@/components/icons/Icon';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Tap } from '@/components/ui/Tap';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/lib/api';
import { ageFromDob, formatDate, formatTime } from '@/lib/format';
import { one, type DoctorAppointment } from '@/lib/types';
import { setVisitStatus, type NextStatus } from '@/lib/clinic';
import { canJoinVideo } from '@/lib/video';

const TYPE_ICON = { video: 'video', phone: 'phone', in_person: 'hospital' } as const;
const TYPE_LABEL = { video: 'Video', phone: 'Phone', in_person: 'In person' } as const;

type Props = {
  visit: DoctorAppointment;
  /** Show the date as well as the time (lists that span several days). */
  withDate?: boolean;
  /** Called after a status change went through, so the list can refresh. */
  onChanged: () => void | Promise<void>;
  onJoin?: (id: string) => void;
  joining?: boolean;
};

/** A visit as the doctor sees it: who, when, why, and the next thing to do. */
export function VisitCard({ visit: v, withDate, onChanged, onJoin, joining }: Props) {
  const t = useTheme();
  const patient = one(v.profiles);
  const name = patient?.full_name ?? 'Patient';
  const age = ageFromDob(patient?.date_of_birth);
  const [busy, setBusy] = useState<NextStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(status: NextStatus) {
    setError(null);
    setBusy(status);
    try {
      await setVisitStatus(v.id, status);
      await onChanged();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not update this visit.');
    } finally {
      setBusy(null);
    }
  }

  const open = () => router.push({ pathname: '/visit/[id]', params: { id: v.id } });
  const live = v.status === 'confirmed' && v.consultation_type === 'video' && canJoinVideo(v.appointment_date, v.appointment_time);

  return (
    <GlassCard padding={16} onPress={open} label={`Visit with ${name}`}>
      <View style={{ gap: 13 }}>
        <View style={{ flexDirection: 'row', gap: 13, alignItems: 'center' }}>
          <Avatar name={name} size={50} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="bodyStrong" numberOfLines={1}>
              {name}
              {age != null ? <Text variant="small" tone="ink3">{`  ·  ${age} yrs`}</Text> : null}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Icon name="clock" size={14} color={t.ink2} />
                <Text variant="small" tone="ink2">
                  {withDate ? `${formatDate(v.appointment_date)}, ` : ''}
                  {formatTime(v.appointment_time)}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Icon name={TYPE_ICON[v.consultation_type] ?? 'hospital'} size={14} color={t.ink2} />
                <Text variant="small" tone="ink2">
                  {TYPE_LABEL[v.consultation_type] ?? 'Visit'}
                </Text>
              </View>
            </View>
          </View>
          <StatusBadge status={v.status} />
        </View>

        {v.chief_complaint ? (
          <Text variant="small" tone="ink2" numberOfLines={2}>
            “{v.chief_complaint}”
          </Text>
        ) : null}

        {v.payment_status === 'paid' || v.payment_due ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name={v.payment_status === 'paid' ? 'check' : 'wallet'} size={14} color={v.payment_status === 'paid' ? t.good : t.warn} accent={v.payment_status === 'paid' ? t.good : t.warn} strokeWidth={2.2} />
            <Text variant="small" style={{ color: v.payment_status === 'paid' ? t.good : t.warn, fontWeight: '700' }}>
              {v.payment_status === 'paid' ? 'Paid online' : 'Awaiting payment'}
            </Text>
          </View>
        ) : null}

        {error ? (
          <Text variant="small" tone="bad" style={{ fontWeight: '600' }}>
            {error}
          </Text>
        ) : null}

        {v.status === 'pending' || v.status === 'confirmed' ? (
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            {patient?.phone ? (
              <Tap onPress={() => Linking.openURL(`tel:${patient.phone}`)} label={`Call ${name}`} hitSlop={6} scaleTo={0.88}>
                <View style={{ width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: `${t.good}26`, borderWidth: 1, borderColor: `${t.good}45` }}>
                  <Icon name="phone" size={20} color={t.good} accent={t.good} />
                </View>
              </Tap>
            ) : null}
            <View style={{ flex: 1 }} />
            {v.status === 'pending' ? (
              <>
                <Button size="sm" variant="danger" title="Decline" loading={busy === 'cancelled'} disabled={!!busy} onPress={() => act('cancelled')} />
                <Button size="sm" icon="check" title="Confirm" loading={busy === 'confirmed'} disabled={!!busy} onPress={() => act('confirmed')} />
              </>
            ) : (
              <>
                {live && onJoin ? <Button size="sm" icon="video" title="Join" loading={joining} onPress={() => onJoin(v.id)} /> : null}
                <Button size="sm" variant={live ? 'soft' : 'primary'} icon="check" title="Complete" loading={busy === 'completed'} disabled={!!busy} onPress={() => act('completed')} />
              </>
            )}
          </View>
        ) : null}
      </View>
    </GlassCard>
  );
}
