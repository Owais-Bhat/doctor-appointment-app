import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AppointmentCard } from '@/components/AppointmentCard';
import { Header } from '@/components/Header';
import { EmptyState, ErrorNote, ListSkeleton } from '@/components/States';
import { Reveal } from '@/components/ui/Reveal';
import { Screen } from '@/components/ui/Screen';
import { Segmented } from '@/components/ui/Segmented';
import { Text } from '@/components/ui/Text';
import { api, ApiError } from '@/lib/api';
import { clinicNow } from '@/lib/clinic-time';
import type { Appointment } from '@/lib/types';
import { useApi } from '@/lib/use-api';

type Tab = 'upcoming' | 'past';

export default function Visits() {
  const { data, loading, error, refreshing, refresh, reload } = useApi<{ appointments: Appointment[] }>('/api/patient/appointments');
  const [tab, setTab] = useState<Tab>('upcoming');
  const [notice, setNotice] = useState<string | null>(null);

  const now = clinicNow();
  const all = data?.appointments ?? [];
  const isUpcoming = (a: Appointment) => ['pending', 'confirmed'].includes(a.status) && `${a.appointment_date} ${a.appointment_time.slice(0, 5)}` >= now;
  const upcoming = all.filter(isUpcoming);
  // Newest first for history
  const past = all.filter((a) => !isUpcoming(a)).reverse();
  const list = tab === 'upcoming' ? upcoming : past;

  async function cancel(id: string) {
    setNotice(null);
    try {
      await api(`/api/patient/appointments/${id}/cancel`, { method: 'POST' });
      await refresh();
    } catch (e) {
      setNotice(e instanceof ApiError ? e.message : 'Could not cancel this visit.');
    }
  }

  return (
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
          {list.map((a, i) => (
            <Reveal key={a.id} index={i}>
              <AppointmentCard appointment={a} cancellable={tab === 'upcoming'} onCancel={cancel} />
            </Reveal>
          ))}
        </View>
      )}
    </Screen>
  );
}
