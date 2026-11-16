import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

import { Icon } from './icons/Icon';
import { Tap } from './ui/Tap';
import { Text } from './ui/Text';

/** Page title row with an optional back button and a trailing slot. */
export function Header({ title, subtitle, back, right }: { title: string; subtitle?: string; back?: boolean; right?: ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      {back ? (
        <Tap onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} label="Go back" style={{ width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: t.card, borderWidth: 1, borderColor: t.line }}>
          <Icon name="chevronLeft" size={22} />
        </Tap>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text variant="title">{title}</Text>
        {subtitle ? <Text tone="ink2">{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}
