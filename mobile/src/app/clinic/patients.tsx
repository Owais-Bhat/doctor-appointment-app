import { useMemo, useState } from 'react';
import { Linking, View } from 'react-native';

import { Header } from '@/components/Header';
import { Icon } from '@/components/icons/Icon';
import { EmptyState, ErrorNote, ListSkeleton } from '@/components/States';
import { Avatar } from '@/components/ui/Avatar';
import { Field } from '@/components/ui/Field';
import { GlassCard } from '@/components/ui/GlassCard';
import { Reveal } from '@/components/ui/Reveal';
import { Screen } from '@/components/ui/Screen';
import { Tap } from '@/components/ui/Tap';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/use-theme';
import { ageFromDob, formatDate } from '@/lib/format';
import type { DoctorPatientRow } from '@/lib/types';
import { useApi } from '@/lib/use-api';

export default function Patients() {
  const t = useTheme();
  const { data, loading, error, refreshing, refresh, reload } = useApi<{ patients: DoctorPatientRow[] }>('/api/doctor/patients');
  const [query, setQuery] = useState('');

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.patients ?? []).filter((p) => p.profiles && (!q || `${p.profiles.full_name} ${p.profiles.phone ?? ''}`.toLowerCase().includes(q)));
  }, [data, query]);

  return (
    <Screen tabs onRefresh={refresh} refreshing={refreshing}>
      <Reveal>
        <Header title="Patients" subtitle={data ? `${data.patients.length} seen or booked` : 'Everyone you have treated'} />
      </Reveal>
      <Reveal index={1}>
        <Field label="Search" icon="search" value={query} onChangeText={setQuery} placeholder="Name or phone" returnKeyType="search" />
      </Reveal>

      {loading ? (
        <ListSkeleton rows={4} />
      ) : error ? (
        <ErrorNote message={error} onRetry={reload} />
      ) : list.length === 0 ? (
        <EmptyState icon="users" title={(data?.patients.length ?? 0) === 0 ? 'No patients yet' : 'No match'} body={(data?.patients.length ?? 0) === 0 ? 'Patients appear here after they book with you.' : 'Try another name.'} />
      ) : (
        <View style={{ gap: 12 }}>
          {list.map((p, i) => {
            const pr = p.profiles!;
            const age = ageFromDob(pr.date_of_birth);
            return (
              <Reveal key={p.patient_id} index={i}>
                <GlassCard padding={16}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                    <Avatar name={pr.full_name} size={52} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text variant="bodyStrong" numberOfLines={1}>
                        {pr.full_name}
                      </Text>
                      <Text variant="small" tone="ink2" numberOfLines={1}>
                        {[age != null ? `${age} yrs` : null, pr.blood_type].filter(Boolean).join(' · ') || 'No details yet'}
                      </Text>
                      <Text variant="small" tone="ink3" numberOfLines={1}>
                        Last visit {formatDate(p.appointment_date)}
                      </Text>
                    </View>
                    {pr.phone ? (
                      <Tap onPress={() => Linking.openURL(`tel:${pr.phone}`)} label={`Call ${pr.full_name}`} hitSlop={8} scaleTo={0.88}>
                        <View style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: `${t.good}26`, borderWidth: 1, borderColor: `${t.good}45` }}>
                          <Icon name="phone" size={22} color={t.good} accent={t.good} />
                        </View>
                      </Tap>
                    ) : null}
                  </View>
                </GlassCard>
              </Reveal>
            );
          })}
        </View>
      )}
    </Screen>
  );
}
