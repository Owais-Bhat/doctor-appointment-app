import { View } from 'react-native';

import { AppearanceCard } from '@/components/AppearanceCard';
import { Header } from '@/components/Header';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Reveal } from '@/components/ui/Reveal';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/context/auth';

export default function AdminAccount() {
  const { profile, signOut } = useAuth();
  return (
    <Screen tabs>
      <Reveal>
        <Header title="Me" subtitle="Your admin account" />
      </Reveal>
      <Reveal index={1}>
        <GlassCard padding={20}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <Avatar name={profile?.full_name ?? 'Admin'} size={64} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text variant="h2" numberOfLines={1}>
                {profile?.full_name}
              </Text>
              <Text tone="ink2" numberOfLines={1}>
                {profile?.email}
              </Text>
              <Badge label="Platform admin" tone="accent" />
            </View>
          </View>
        </GlassCard>
      </Reveal>
      <Reveal index={2}>
        <AppearanceCard />
      </Reveal>
      <Reveal index={3} style={{ gap: 10 }}>
        <Button title="Sign out" icon="logout" variant="danger" onPress={signOut} />
        <Text variant="small" tone="ink3" style={{ textAlign: 'center' }}>
          Doctors’ settings, fees and verification are managed from the Doctors tab.
        </Text>
      </Reveal>
    </Screen>
  );
}
