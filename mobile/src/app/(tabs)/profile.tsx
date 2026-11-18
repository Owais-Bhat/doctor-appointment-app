import { router } from 'expo-router';
import { View } from 'react-native';

import { AppearanceCard } from '@/components/AppearanceCard';
import { LanguageCard } from '@/components/LanguageCard';
import { SecurityCard } from '@/components/SecurityCard';
import { Header } from '@/components/Header';
import { Icon } from '@/components/icons/Icon';
import type { IconName } from '@/components/icons/paths';
import { ErrorNote } from '@/components/States';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Reveal } from '@/components/ui/Reveal';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/hooks/use-theme';
import { formatDateLong } from '@/lib/format';
import type { PatientProfile } from '@/lib/types';
import { useApi } from '@/lib/use-api';

export default function Profile() {
  const t = useTheme();
  const { profile, signOut } = useAuth();
  const { data, loading, error, refreshing, refresh, reload } = useApi<{ profile: PatientProfile }>('/api/patient/profile');
  const p = data?.profile;

  const rows: { icon: IconName; label: string; value: string | null | undefined }[] = [
    { icon: 'mail', label: 'Email', value: p?.email || profile?.email },
    { icon: 'phone', label: 'Phone', value: p?.phone },
    { icon: 'droplet', label: 'Blood type', value: p?.blood_type },
    { icon: 'calendar', label: 'Date of birth', value: p?.date_of_birth ? formatDateLong(p.date_of_birth) : null },
    { icon: 'user', label: 'Gender', value: p?.gender },
    { icon: 'pin', label: 'Address', value: p?.address },
    { icon: 'alert', label: 'Allergies', value: p?.health_stats?.allergies },
    { icon: 'heart', label: 'Conditions', value: p?.health_stats?.chronic_conditions },
  ];

  return (
    <Screen tabs onRefresh={refresh} refreshing={refreshing}>
      <Reveal>
        <Header title="Me" subtitle="Your account and health details" />
      </Reveal>

      <Reveal index={1}>
        <GlassCard padding={20}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <Avatar name={p?.full_name ?? profile?.full_name ?? 'You'} size={64} />
            <View style={{ flex: 1 }}>
              <Text variant="h2" numberOfLines={1}>
                {p?.full_name ?? profile?.full_name}
              </Text>
              <Text tone="ink2" numberOfLines={1}>
                {p?.email || profile?.email}
              </Text>
            </View>
          </View>
        </GlassCard>
      </Reveal>

      <Reveal index={2}>
        {loading ? (
          <Skeleton height={260} radius={24} />
        ) : error ? (
          <ErrorNote message={error} onRetry={reload} />
        ) : (
          <GlassCard padding={6}>
            {rows.map((r, i) => (
              <View key={r.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderTopWidth: i ? 1 : 0, borderTopColor: t.line }}>
                <Icon name={r.icon} size={22} />
                <Text tone="ink2" style={{ width: 104 }}>
                  {r.label}
                </Text>
                <Text style={{ flex: 1, fontWeight: '600' }} numberOfLines={2}>
                  {r.value || '—'}
                </Text>
              </View>
            ))}
          </GlassCard>
        )}
      </Reveal>

      <Reveal index={3} style={{ gap: 12 }}>
        <AppearanceCard />
        <LanguageCard />
        <SecurityCard />
      </Reveal>

      <Reveal index={4} style={{ gap: 10 }}>
        <Button title="Edit health details" icon="edit" onPress={() => router.push('/edit-profile')} />
        <Button title="Family members" icon="users" variant="soft" onPress={() => router.push('/family')} />
        <Button title="My reports" icon="fileText" variant="soft" onPress={() => router.push('/reports')} />
        <Button title="Notifications" icon="bell" variant="soft" onPress={() => router.push('/notifications')} />
        <Button title="Sign out" icon="logout" variant="danger" onPress={signOut} />
      </Reveal>
    </Screen>
  );
}
