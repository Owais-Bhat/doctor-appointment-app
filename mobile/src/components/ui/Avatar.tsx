import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { View } from 'react-native';

import { initials } from '@/lib/format';

import { Text } from './Text';

const PAIRS: [string, string][] = [
  ['#007AFF', '#5856d6'],
  ['#10b981', '#0ea5e9'],
  ['#f59e0b', '#ef4444'],
  ['#ec4899', '#8b5cf6'],
  ['#14b8a6', '#3b82f6'],
];

/** Photo when there is one, otherwise gradient initials (colour is stable per name). */
export function Avatar({ name, uri, size = 52 }: { name: string; uri?: string | null; size?: number }) {
  const hash = [...name].reduce((n, c) => n + c.charCodeAt(0), 0);
  const [a, b] = PAIRS[hash % PAIRS.length];
  if (uri) return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} contentFit="cover" transition={200} />;
  return (
    <LinearGradient colors={[a, b]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: size, height: size, borderRadius: size / 2 }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text variant="bodyStrong" tone="onAccent" style={{ fontSize: size * 0.36 }}>
          {initials(name)}
        </Text>
      </View>
    </LinearGradient>
  );
}
