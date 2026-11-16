import { BlurView } from 'expo-blur';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { useTheme } from '@/hooks/use-theme';

function Blob({ color, size, x, y, dx, dy, duration }: { color: string; size: number; x: number; y: number; dx: number; dy: number; duration: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withSequence(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration, easing: Easing.inOut(Easing.sin) })), -1);
  }, [duration, t]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: dx * t.value }, { translateY: dy * t.value }, { scale: 1 + 0.12 * t.value }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', left: x, top: y, width: size, height: size, borderRadius: size / 2, backgroundColor: color }, style]}
    />
  );
}

/** Slowly drifting colour blobs under a blur — the web app's "aurora" backdrop. */
export function Aurora() {
  const t = useTheme();
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: t.bg }]} pointerEvents="none">
      <Blob color={t.blob1} size={320} x={-110} y={-90} dx={60} dy={40} duration={7000} />
      <Blob color={t.blob2} size={300} x={150} y={140} dx={-70} dy={60} duration={9000} />
      <Blob color={t.blob3} size={260} x={-60} y={520} dx={50} dy={-50} duration={11000} />
      <BlurView intensity={70} tint={t.blur} style={StyleSheet.absoluteFill} />
    </View>
  );
}
