import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/use-theme';

type Point = { label: string; value: number };

function Bar({ value, max, height, index, highlight }: { value: number; max: number; height: number; index: number; highlight: boolean }) {
  const t = useTheme();
  const h = useSharedValue(0);
  const target = max > 0 ? Math.max(value > 0 ? 6 : 2, (value / max) * height) : 2;
  useEffect(() => {
    h.set(withDelay(index * 70, withTiming(target, { duration: 700, easing: Easing.out(Easing.cubic) })));
  }, [target, index, h]);
  const style = useAnimatedStyle(() => ({ height: h.get() }));
  return (
    <Animated.View style={[{ width: '100%', borderRadius: 10, overflow: 'hidden' }, style]}>
      <LinearGradient colors={highlight ? [t.accent, t.accent2] : [`${t.accent}99`, `${t.accent2}66`]} style={{ flex: 1 }} />
    </Animated.View>
  );
}

/** Small animated bar chart: the last bar is highlighted. */
export function BarChart({ data, height = 120, format }: { data: Point[]; height?: number; format?: (n: number) => string }) {
  const t = useTheme();
  const max = Math.max(0, ...data.map((d) => d.value));
  return (
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-end' }}>
      {data.map((d, i) => (
        <View key={`${d.label}-${i}`} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
          <Text variant="small" tone={i === data.length - 1 ? 'ink' : 'ink3'} style={{ fontSize: 11, fontWeight: '700' }} numberOfLines={1}>
            {format ? format(d.value) : String(d.value)}
          </Text>
          <View style={{ height, width: '100%', justifyContent: 'flex-end' }}>
            <Bar value={d.value} max={max} height={height} index={i} highlight={i === data.length - 1} />
          </View>
          <Text variant="small" style={{ fontSize: 11, color: t.ink3, fontWeight: '600' }}>
            {d.label}
          </Text>
        </View>
      ))}
    </View>
  );
}
