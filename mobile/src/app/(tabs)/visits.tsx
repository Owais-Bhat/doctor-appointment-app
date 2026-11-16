import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

import { AppointmentCard } from '@/components/AppointmentCard';
import { Checkout } from '@/components/Checkout';
import { Header } from '@/components/Header';
import { PaidSheet } from '@/components/PaidSheet';
import { EmptyState, ErrorNote, ListSkeleton } from '@/components/States';
import { Reveal } from '@/components/ui/Reveal';
import { Screen } from '@/components/ui/Screen';
import { Segmented } from '@/components/ui/Segmented';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/use-theme';
import { api, ApiError } from '@/lib/api';
import { clinicNow } from '@/lib/clinic-time';
import { paymentState } from '@/lib/payments';
import { one, withDr, type Appointment } from '@/lib/types';
import { useApi } from '@/lib/use-api';
import { usePayVisit } from '@/lib/use-pay-visit';
import { canJoinVideo, joinVideoVisit } from '@/lib/video';

type Tab = 'upcoming' | 'past';

export default function Visits() {
  const t = useTheme();
  const { data, loading, error, refreshing, refresh, reload } = useApi<{ appointments: Appointment[]; paymentsEnabled?: boolean }>('/api/patient/appointments');
  const [tab, setTab] = useState<Tab>('upcoming');
  const [notice, setNotice] = useState<string | null>(null);
  const [paidId, setPaidId] = useState<string | null>(null);
  const [joining, setJoining] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<{ id: string; message: string } | null>(null);

  const onPaid = useCallback(
    (id: string) => {
      setPaidId(id);
      void refresh();
    },
    [refresh],
  );
  const { pay, payingId, error: payError, checkout } = usePayVisit(onPaid);

  const now = clinicNow();
  const all = data?.appointments ?? [];
  const paymentsEnabled = !!data?.paymentsEnabled;
  const isUpcoming = (a: Appointment) => ['pending', 'confirmed'].includes(a.status) && `${a.appointment_date} ${a.appointment_time.slice(0, 5)}` >= now;
  // A video visit stays joinable until the end of its day, so keep today's confirmed ones in "Upcoming"
  const isLive = (a: Appointment) => a.status === 'confirmed' && a.consultation_type === 'video' && canJoinVideo(a.appointment_date, a.appointment_time);
  const upcoming = all.filter((a) => isUpcoming(a) || isLive(a));
  // Newest first for history
  const past = all.filter((a) => !isUpcoming(a) && !isLive(a)).reverse();
  const list = tab === 'upcoming' ? upcoming : past;
  const paid = all.find((a) => a.id === paidId);

  async function cancel(id: string) {
    setNotice(null);
    try {
      await api(`/api/patient/appointments/${id}/cancel`, { method: 'POST' });
      await refresh();
    } catch (e) {
      setNotice(e instanceof ApiError ? e.message : 'Could not cancel this visit.');
    }
  }

  async function join(id: string) {
    setJoinError(null);
    setJoining(id);
    try {
      await joinVideoVisit(id, t.accent);
    } catch (e) {
      setJoinError({ id, message: e instanceof ApiError ? e.message : 'The video room could not be opened. Try again in a moment.' });
    } finally {
      setJoining(null);
    }
  }

  return (
    <>
      <Screen tabs onRefresh={refresh} refreshing={refreshing}>
        <Reveal>
          <Header title="My visits" subtitle="Everything you have booked" />
        </Reveal>
        <Reveal index={1}>
          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              { value: 'upcoming', label: `Upcoming${upcoming.length ? ` (${upcoming.length})` : ''}`, icon: 'calendar' },
              { value: 'past', label: 'Past', icon: 'clock' },
            ]}
          />
        </Reveal>

        {notice ? (
          <Text tone="bad" style={{ fontWeight: '600' }}>
            {notice}
          </Text>
        ) : null}

        {loading ? (
          <ListSkeleton />
        ) : error ? (
          <ErrorNote message={error} onRetry={reload} />
        ) : list.length === 0 ? (
          <EmptyState
            icon={tab === 'upcoming' ? 'calendarPlus' : 'clock'}
            title={tab === 'upcoming' ? 'No upcoming visits' : 'No past visits yet'}
            body={tab === 'upcoming' ? 'Book a doctor and your visit will show up here.' : 'Completed and cancelled visits appear here.'}
            action={tab === 'upcoming' ? { title: 'Book a visit', onPress: () => router.navigate('/book') } : undefined}
          />
        ) : (
          <View style={{ gap: 14 }}>
            {list.map((a, i) => {
              const live = tab === 'upcoming';
              return (
                <Reveal key={a.id} index={i}>
                  <AppointmentCard
                    appointment={a}
                    payment={paymentState(a, paymentsEnabled)}
                    cancellable={live}
                    // Once a visit has started it can be joined but no longer cancelled
                    onCancel={live && isUpcoming(a) ? cancel : undefined}
                    onPay={pay}
                    paying={payingId === a.id}
                    canJoin={live && isLive(a)}
                    onJoin={join}
                    joining={joining === a.id}
                    error={payError?.id === a.id ? payError.message : joinError?.id === a.id ? joinError.message : null}
                  />
                </Reveal>
              );
            })}
          </View>
        )}
      </Screen>

      <Checkout {...checkout} />
      <PaidSheet
        visible={!!paidId}
        detail={paid ? `${withDr(one(paid.doctor_profiles?.profiles)?.full_name ?? 'your doctor')} will see you as planned.` : undefined}
        onClose={() => setPaidId(null)}
      />
    </>
  );
}
