import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Header } from '@/components/Header';
import { Icon } from '@/components/icons/Icon';
import { EmptyState, ErrorNote, ListSkeleton } from '@/components/States';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Reveal } from '@/components/ui/Reveal';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { api, ApiError } from '@/lib/api';
import { rupees } from '@/lib/clinic';
import { one, type AdminDoctor } from '@/lib/types';
import { useApi } from '@/lib/use-api';

export default function Doctors() {
  const { data, loading, error, refreshing, refresh, reload } = useApi<{ doctors: AdminDoctor[] }>('/api/super-admin/doctors');
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Waiting for review first, then everyone else
  const list = [...(data?.doctors ?? [])].sort((a, b) => Number(a.is_verified) - Number(b.is_verified));

  async function setVerified(d: AdminDoctor, is_verified: boolean) {
    setBusy(d.id);
    setMessage(null);
    try {
      await api('/api/super-admin/doctors', { method: 'PATCH', body: { doctorId: d.id, is_verified } });
      await refresh();
    } catch (e) {
      setMessage(e instanceof ApiError ? e.message : 'Could not update the doctor.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <Screen tabs onRefresh={refresh} refreshing={refreshing}>
      <Reveal>
        <Header title="Doctors" subtitle="Verify who patients can book" right={<Button size="sm" icon="userPlus" title="Add" onPress={() => router.push('/add-doctor')} />} />
      </Reveal>
      {message ? (
        <Text tone="bad" style={{ fontWeight: '600' }}>
          {message}
        </Text>
      ) : null}

      {loading ? (
        <ListSkeleton rows={3} />
      ) : error ? (
        <ErrorNote message={error} onRetry={reload} />
      ) : list.length === 0 ? (
        <EmptyState icon="stethoscope" title="No doctors yet" body="Add the first doctor, or promote a user from the Users tab." action={{ title: 'Add a doctor', onPress: () => router.push('/add-doctor') }} />
      ) : (
        <View style={{ gap: 12 }}>
          {list.map((d, i) => {
            const pr = one(d.profiles);
            const name = pr?.full_name ?? 'Doctor';
            return (
              <Reveal key={d.id} index={i}>
                <GlassCard padding={16}>
                  <View style={{ gap: 13 }}>
                    <View style={{ flexDirection: 'row', gap: 13, alignItems: 'center' }}>
                      <Avatar name={name} size={52} />
                      <View style={{ flex: 1, gap: 3 }}>
                        <Text variant="bodyStrong" numberOfLines={1}>
                          {name.startsWith('Dr') ? name : `Dr. ${name}`}
                        </Text>
                        <Text variant="small" tone="ink2" numberOfLines={1}>
                          {d.specialty}
                          {d.consultation_fee != null ? ` · ${rupees(Number(d.consultation_fee))}` : ''}
                        </Text>
                        <Text variant="small" tone="ink3" numberOfLines={1}>
                          {pr?.email}
                        </Text>
                      </View>
                      <Badge label={d.is_verified ? 'Live' : 'Review'} tone={d.is_verified ? 'good' : 'warn'} />
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Icon name="shield" size={15} color={d.registration_number ? undefined : undefined} />
                      <Text variant="small" tone="ink2" numberOfLines={1} style={{ flex: 1 }}>
                        {d.registration_number ? `Reg. ${d.registration_number}${d.registration_council ? ` · ${d.registration_council}` : ''}` : 'No registration number — can’t be verified yet'}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                      {d.is_verified ? (
                        <Button size="sm" variant="danger" icon="ban" title="Hide from search" loading={busy === d.id} disabled={!!busy} onPress={() => setVerified(d, false)} />
                      ) : (
                        <Button size="sm" icon="check" title="Verify" loading={busy === d.id} disabled={!!busy || !d.registration_number} onPress={() => setVerified(d, true)} />
                      )}
                    </View>
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
