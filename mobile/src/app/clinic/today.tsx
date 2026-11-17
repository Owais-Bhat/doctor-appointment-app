import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { GlassIconButton, Header } from '@/components/Header';
import { AnimatedIcon } from '@/components/icons/Icon';
import { VisitCard } from '@/components/clinic/VisitCard';
import { EmptyState, ErrorNote, ListSkeleton } from '@/components/States';
import { StatTile } from '@/components/StatTile';
import { Reveal } from '@/components/ui/Reveal';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/lib/api';
import { rupees } from '@/lib/clinic';
import { greeting } from '@/lib/format';
import type { DoctorAppointment, DoctorStats, AppNotification } from '@/lib/types';
import { useApi } from '@/lib/use-api';
import { joinVideoVisit } from '@/lib/video';

export default function Today() {
  const t = useTheme();
  const { profile } = useAuth();
  const stats = useApi<{ stats: DoctorStats | null }>('/api/doctor/stats');
  const today = useApi<{ appointments: DoctorAppointment[]; counts: { requests: number; today: number } }>('/api/doctor/appointments?scope=today');
  const requests = useApi<{ appointments: DoctorAppointment[] }>('/api/doctor/appointments?scope=requests');
  const notes = useApi<{ notifications: AppNotification[] }>('/api/patient/notifications');
  const [joining, setJoining] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  const refresh = async () => {
    await Promise.all([stats.refresh(), today.refresh(), requests.refresh(), notes.refresh()]);
  };
  const unread = (notes.data?.notifications ?? []).filter((n) => !n.is_read).length;
  const s = stats.data?.stats;
  const pending = requests.data?.appointments ?? [];
  const name = (profile?.full_name ?? '').replace(/^dr\.?\s+/i, '').split(' ')[0];

  async function join(id: string) {
    setJoinError(null);
    setJoining(id);
    try {
      await joinVideoVisit(id, t.accent);
    } catch (e) {
      setJoinError(e instanceof ApiError ? e.message : 'The video room could not be opened.');
    } finally {
      setJoining(null);
    }
  }

  return (
    <Screen tabs onRefresh={refresh} refreshing={today.refreshing || stats.refreshing}>
      <Reveal>
        <Header
          title={name ? `${greeting()}, Dr. ${name}` : greeting()}
          subtitle={s ? `${s.today_count} visit${s.today_count === 1 ? '' : 's'} today` : 'Your day at a glance'}
          right={
            <GlassIconButton onPress={() => router.push('/notifications')} label="Notifications">
              <AnimatedIcon name="bell" size={24} delay={300} />
              {unread > 0 ? <View style={{ position: 'absolute', top: 11, right: 12, width: 10, height: 10, borderRadius: 5, backgroundColor: t.bad, borderWidth: 2, borderColor: t.bg }} /> : null}
            </GlassIconButton>
          }
        />
      </Reveal>

      {stats.error ? (
        <ErrorNote message={stats.error} onRetry={stats.reload} />
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          <Reveal index={1} style={{ width: '47.5%', flexGrow: 1 }}>
            <StatTile icon="calendar" value={s ? String(s.today_count) : '–'} label="Today" hint={pending.length ? `${pending.length} to confirm` : undefined} tint={t.accent} />
          </Reveal>
          <Reveal index={2} style={{ width: '47.5%', flexGrow: 1 }}>
            <StatTile icon="users" value={s ? String(s.total_patients) : '–'} label="Patients" />
          </Reveal>
          <Reveal index={3} style={{ width: '47.5%', flexGrow: 1 }}>
            <StatTile icon="star" value={s ? (s.total_reviews > 0 ? s.rating.toFixed(1) : 'New') : '–'} label="Rating" hint={s ? `${s.total_reviews} reviews` : undefined} />
          </Reveal>
          <Reveal index={4} style={{ width: '47.5%', flexGrow: 1 }}>
            <StatTile icon="wallet" value={s ? rupees(s.payments_enabled ? s.collected_mtd : s.revenue_mtd) : '–'} label={s?.payments_enabled ? 'Paid online, this month' : 'This month'} />
          </Reveal>
        </View>
      )}

      {pending.length > 0 ? (
        <Reveal index={5} style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <Text variant="h2">Waiting for you</Text>
            <Text variant="small" tone="accent" style={{ fontWeight: '800' }} onPress={() => router.navigate('/clinic/appointments')}>
              See all
            </Text>
          </View>
          {pending.slice(0, 2).map((v) => (
            <VisitCard key={v.id} visit={v} withDate onChanged={refresh} />
          ))}
        </Reveal>
      ) : null}

      <Reveal index={6} style={{ gap: 12 }}>
        <Text variant="h2">Today’s schedule</Text>
        {joinError ? (
          <Text tone="bad" style={{ fontWeight: '600' }}>
            {joinError}
          </Text>
        ) : null}
        {today.loading ? (
          <ListSkeleton rows={2} />
        ) : today.error ? (
          <ErrorNote message={today.error} onRetry={today.reload} />
        ) : (today.data?.appointments.length ?? 0) === 0 ? (
          <EmptyState icon="calendar" title="A quiet day" body="No visits are booked for today." />
        ) : (
          <View style={{ gap: 12 }}>
            {today.data?.appointments.map((v) => (
              <VisitCard key={v.id} visit={v} onChanged={refresh} onJoin={join} joining={joining === v.id} />
            ))}
          </View>
        )}
      </Reveal>
    </Screen>
  );
}
