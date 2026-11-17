import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Header } from '@/components/Header';
import { VisitCard } from '@/components/clinic/VisitCard';
import { EmptyState, ErrorNote, ListSkeleton } from '@/components/States';
import { GlassChip } from '@/components/ui/GlassChip';
import { Reveal } from '@/components/ui/Reveal';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/lib/api';
import type { DoctorAppointment } from '@/lib/types';
import { useApi } from '@/lib/use-api';
import { joinVideoVisit } from '@/lib/video';

const SCOPES = [
  { value: 'requests', label: 'Requests', empty: 'No requests waiting. New bookings show up here.' },
  { value: 'upcoming', label: 'Upcoming', empty: 'No confirmed visits ahead.' },
  { value: 'today', label: 'Today', empty: 'Nothing booked for today.' },
  { value: 'past', label: 'Past', empty: 'Finished visits appear here.' },
] as const;
type Scope = (typeof SCOPES)[number]['value'];

export default function Appointments() {
  const t = useTheme();
  const [scope, setScope] = useState<Scope>('requests');
  const { data, loading, error, refreshing, refresh, reload } = useApi<{ appointments: DoctorAppointment[]; counts: { requests: number; today: number } }>(`/api/doctor/appointments?scope=${scope}`);
  const [joining, setJoining] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const counts = data?.counts;
  const current = SCOPES.find((s) => s.value === scope)!;

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
    <Screen tabs onRefresh={refresh} refreshing={refreshing}>
      <Reveal>
        <Header title="Visits" subtitle="Confirm, run and finish your appointments" />
      </Reveal>
      <Reveal index={1}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 8 }}>
          {SCOPES.map((s) => {
            const n = s.value === 'requests' ? counts?.requests : s.value === 'today' ? counts?.today : undefined;
            return <GlassChip key={s.value} label={`${s.label}${n ? ` (${n})` : ''}`} selected={scope === s.value} height={42} onPress={() => setScope(s.value)} />;
          })}
        </ScrollView>
      </Reveal>

      {joinError ? (
        <Text tone="bad" style={{ fontWeight: '600' }}>
          {joinError}
        </Text>
      ) : null}

      {loading ? (
        <ListSkeleton rows={3} />
      ) : error ? (
        <ErrorNote message={error} onRetry={reload} />
      ) : (data?.appointments.length ?? 0) === 0 ? (
        <EmptyState icon={scope === 'requests' ? 'bell' : 'calendar'} title="Nothing here" body={current.empty} />
      ) : (
        <View style={{ gap: 12 }}>
          {data?.appointments.map((v, i) => (
            <Reveal key={v.id} index={i}>
              <VisitCard visit={v} withDate={scope !== 'today'} onChanged={refresh} onJoin={join} joining={joining === v.id} />
            </Reveal>
          ))}
        </View>
      )}
    </Screen>
  );
}
