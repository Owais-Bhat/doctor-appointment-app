import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { DoctorCard } from '@/components/DoctorCard';
import { Header } from '@/components/Header';
import { EmptyState, ErrorNote, ListSkeleton } from '@/components/States';
import { Field } from '@/components/ui/Field';
import { Reveal } from '@/components/ui/Reveal';
import { Screen } from '@/components/ui/Screen';
import { GlassChip } from '@/components/ui/GlassChip';
import { SPECIALTIES } from '@/lib/config';
import { doctorName, type Doctor } from '@/lib/types';
import { useFavorites } from '@/lib/use-favorites';
import { useApi } from '@/lib/use-api';

export default function Doctors() {
  const params = useLocalSearchParams<{ specialty?: string }>();
  const { data, loading, error, refreshing, refresh, reload } = useApi<{ doctors: Doctor[] }>('/api/doctors', { auth: false });
  const [query, setQuery] = useState('');
  const favorites = useFavorites();
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  // The chip picked on the Book tab wins until the user changes it
  const [picked, setPicked] = useState<string | null>(null);
  const specialty = picked !== null ? picked || null : (params.specialty ?? null);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.doctors ?? []).filter(
      (d) =>
        (!onlyFavorites || favorites.isFavorite(d.id)) &&
        (!specialty || d.specialty === specialty) &&
        (!q || `${doctorName(d)} ${d.specialty} ${d.clinic_name ?? ''}`.toLowerCase().includes(q)),
    );
  }, [data, query, specialty, onlyFavorites, favorites]);

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
          <GlassChip label="♥ Favourites" selected={onlyFavorites} height={42} onPress={() => setOnlyFavorites((v) => !v)} />
          {[null, ...SPECIALTIES].map((s) => {
            const on = !onlyFavorites && (s ?? null) === specialty;
            return (
              <GlassChip key={s ?? 'all'} label={s ?? 'All'} selected={on} height={42} onPress={() => {
                  setOnlyFavorites(false);
                  setPicked(s ?? '');
                }} />
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
          title={(data?.doctors.length ?? 0) === 0 ? 'No doctors yet' : onlyFavorites ? 'No favourites yet' : 'No match'}
          body={(data?.doctors.length ?? 0) === 0 ? 'Verified doctors will show up here.' : onlyFavorites ? 'Tap the heart on a doctor to keep them here.' : 'Try a different name or specialty.'}
        />
      ) : (
        <View style={{ gap: 12 }}>
          {list.map((d, i) => (
            <Reveal key={d.id} index={i}>
              <DoctorCard doctor={d} favorite={favorites.isFavorite(d.id)} onToggleFavorite={() => void favorites.toggle(d.id)} />
            </Reveal>
          ))}
        </View>
      )}
    </Screen>
  );
}
