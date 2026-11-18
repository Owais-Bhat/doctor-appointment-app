import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AppearanceCard } from '@/components/AppearanceCard';
import { LanguageCard } from '@/components/LanguageCard';
import { SecurityCard } from '@/components/SecurityCard';
import { Header } from '@/components/Header';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Reveal } from '@/components/ui/Reveal';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/context/auth';
import { downloadAndShare } from '@/lib/files';

export default function AdminAccount() {
  const { profile, signOut } = useAuth();
  const [exporting, setExporting] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  async function exportCsv(type: 'users' | 'visits' | 'payments') {
    setExporting(type);
    setExportError(null);
    try {
      await downloadAndShare(`/api/super-admin/export?type=${type}`, `medflow-${type}-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
    } catch (e) {
      setExportError(e instanceof Error ? e.message : 'Could not export.');
    } finally {
      setExporting(null);
    }
  }
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
      <Reveal index={2} style={{ gap: 12 }}>
        <AppearanceCard />
        <LanguageCard />
        <SecurityCard />
      </Reveal>
      <Reveal index={3} style={{ gap: 10 }}>
        <Button title="Refunds" icon="wallet" variant="soft" onPress={() => router.push('/refunds')} />
        <Text variant="small" tone="ink3" style={{ marginLeft: 6, fontWeight: '700' }}>
          Download as a spreadsheet (CSV)
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {(['users', 'visits', 'payments'] as const).map((type) => (
            <Button
              key={type}
              size="sm"
              variant="soft"
              icon="fileText"
              title={type[0].toUpperCase() + type.slice(1)}
              loading={exporting === type}
              disabled={!!exporting}
              onPress={() => void exportCsv(type)}
            />
          ))}
        </View>
        {exportError ? (
          <Text tone="bad" style={{ fontWeight: '600' }}>
            {exportError}
          </Text>
        ) : null}
        <Button title="Sign out" icon="logout" variant="danger" onPress={signOut} />
        <Text variant="small" tone="ink3" style={{ textAlign: 'center' }}>
          Doctors’ settings, fees and verification are managed from the Doctors tab.
        </Text>
      </Reveal>
    </Screen>
  );
}
