import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { DoctorCard } from '@/components/DoctorCard';
import { Header } from '@/components/Header';
import { EmptyState, ErrorNote, ListSkeleton } from '@/components/States';
import { Field } from '@/components/ui/Field';
import { Reveal } from '@/components/ui/Reveal';
import { Screen } from '@/components/ui/Screen';
import { Tap } from '@/components/ui/Tap';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/use-theme';
import { SPECIALTIES } from '@/lib/config';
import { doctorName, type Doctor } from '@/lib/types';
import { useApi } from '@/lib/use-api';

export default function Doctors() {
  const t = useTheme();
  const params = useLocalSearchParams<{ specialty?: string }>();
  const { data, loading, error, refreshing, refresh, reload } = useApi<{ doctors: Doctor[] }>('/api/doctors', { auth: false });
  const [query, setQuery] = useState('');
  // The chip picked on the Book tab wins until the user changes it
  const [picked, setPicked] = useState<string | null>(null);
  const specialty = picked !== null ? picked || null : (params.specialty ?? null);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.doctors ?? []).filter(
      (d) =>
        (!specialty || d.specialty === specialty) &&
        (!q || `${doctorName(d)} ${d.specialty} ${d.clinic_name ?? ''}`.toLowerCase().includes(q)),
    );
  }, [data, query, specialty]);

  return (
    <Screen tabs onRefresh={refresh} refreshing={refreshing}>
      <Reveal>
        <Header title="Doctors" subtitle="Verified specialists, ready to see you" />
      </Reveal>
      <Reveal index={1}>
        <Field label="Search" icon="search" value={query} onChangeText={setQuery} placeholder="Name, specialty or clinic" returnKeyType="search" />
      </Reveal>

      <Reveal index={2}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 8 }}>
          {[null, ...SPECIALTIES].map((s) => {
            const on = (s ?? null) === specialty;
            return (
              <Tap key={s ?? 'all'} onPress={() => setPicked(s ?? '')} scaleTo={0.92} label={s ?? 'All'}>
                <View style={{ paddingHorizontal: 16, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? t.accent : t.card, borderWidth: 1, borderColor: on ? t.accent : t.line }}>
                  <Text variant="small" tone={on ? 'onAccent' : 'ink2'} style={{ fontWeight: '700' }}>
                    {s ?? 'All'}
                  </Text>
                </View>
              </Tap>
            );
          })}
        </ScrollView>
      </Reveal>

      {loading ? (
        <ListSkeleton rows={4} />
      ) : error ? (
        <ErrorNote message={error} onRetry={reload} />
      ) : list.length === 0 ? (
        <EmptyState
          icon="search"
          title={(data?.doctors.length ?? 0) === 0 ? 'No doctors yet' : 'No match'}
          body={(data?.doctors.length ?? 0) === 0 ? 'Verified doctors will show up here.' : 'Try a different name or specialty.'}
        />
      ) : (
        <View style={{ gap: 12 }}>
          {list.map((d, i) => (
            <Reveal key={d.id} index={i}>
              <DoctorCard doctor={d} />
            </Reveal>
          ))}
        </View>
      )}
    </Screen>
  );
}
