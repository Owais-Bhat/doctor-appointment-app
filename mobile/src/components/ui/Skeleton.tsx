import { useEffect } from 'react';
import type { DimensionValue, StyleProp, ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { useTheme } from '@/hooks/use-theme';

/** Pulsing placeholder shown while data loads. */
export function Skeleton({ height = 16, width = '100%', radius = 12, style }: { height?: number; width?: DimensionValue; radius?: number; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  const o = useSharedValue(0.45);
  useEffect(() => {
    o.set(withRepeat(withSequence(withTiming(1, { duration: 750, easing: Easing.inOut(Easing.quad) }), withTiming(0.45, { duration: 750, easing: Easing.inOut(Easing.quad) })), -1));
  }, [o]);
  const anim = useAnimatedStyle(() => ({ opacity: o.get() }));
  return <Animated.View style={[{ height, width, borderRadius: radius, backgroundColor: t.line2 }, anim, style]} />;
}
