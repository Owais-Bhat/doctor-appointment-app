import { router } from 'expo-router';
import { View } from 'react-native';

import { Header } from '@/components/Header';
import { AnimatedIcon } from '@/components/icons/Icon';
import { specialtyIcon } from '@/components/icons/paths';
import { GlassCard } from '@/components/ui/GlassCard';
import { Reveal } from '@/components/ui/Reveal';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { SPECIALTIES } from '@/lib/config';

/** Step 1 of booking: choose what you need, then pick a doctor and a time. */
export default function Book() {
  return (
    <Screen tabs>
      <Reveal>
        <Header title="Book a visit" subtitle="What do you need help with?" />
      </Reveal>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {SPECIALTIES.map((s, i) => (
          <Reveal key={s} index={i} style={{ width: '48%', flexGrow: 1 }}>
            <GlassCard padding={16} label={s} onPress={() => router.navigate({ pathname: '/doctors', params: { specialty: s } })}>
              <View style={{ gap: 12, alignItems: 'flex-start' }}>
                <AnimatedIcon name={specialtyIcon(s)} size={34} delay={150 + i * 90} strokeWidth={1.6} />
                <Text variant="bodyStrong">{s}</Text>
              </View>
            </GlassCard>
          </Reveal>
        ))}
      </View>
    </Screen>
  );
}
