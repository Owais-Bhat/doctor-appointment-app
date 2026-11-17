import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Icon } from './icons/Icon';
import { GlassSurface } from './ui/GlassSurface';
import { Tap } from './ui/Tap';
import { Text } from './ui/Text';

/** A round glass button, for icons in a header. */
export function GlassIconButton({ onPress, label, children, size = 46 }: { onPress: () => void; label: string; children: ReactNode; size?: number }) {
  return (
    <Tap onPress={onPress} label={label} scaleTo={0.9}>
      <GlassSurface radius={size / 2} variant="strong" shadow={false} style={{ width: size, height: size }} contentStyle={{ width: size - 2, height: size - 2, alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </GlassSurface>
    </Tap>
  );
}

/** Page title row with an optional back button and a trailing slot. */
export function Header({ title, subtitle, back, right }: { title: string; subtitle?: string; back?: boolean; right?: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      {back ? (
        <GlassIconButton onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} label="Go back">
          <Icon name="chevronLeft" size={22} />
        </GlassIconButton>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text variant="title">{title}</Text>
        {subtitle ? <Text tone="ink2">{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}
