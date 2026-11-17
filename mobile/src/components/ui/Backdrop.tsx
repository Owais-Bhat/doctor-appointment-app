import { BlurTargetView } from 'expo-blur';
import { createContext, useContext, useEffect, useRef, type ReactNode, type RefObject } from 'react';
import { StyleSheet, View, type HostInstance } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { useTheme } from '@/hooks/use-theme';

/** The view glass surfaces blur. Android needs it handed over explicitly; iOS and web ignore it. */
const BlurTargetContext = createContext<RefObject<HostInstance | null> | null>(null);
export const useBlurTarget = () => useContext(BlurTargetContext);

/** A soft round glow made with a radial gradient, so it needs no blur of its own. */
function Orb({ color, size, x, y, dx, dy, duration }: { color: string; size: number; x: number; y: number; dx: number; dy: number; duration: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    const ease = { duration, easing: Easing.inOut(Easing.sin) };
    t.set(withRepeat(withSequence(withTiming(1, ease), withTiming(0, ease)), -1));
  }, [duration, t]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: dx * t.get() }, { translateY: dy * t.get() }, { scale: 1 + 0.14 * t.get() }],
  }));
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: x, top: y, width: size, height: size }, style]}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id="g" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={color} stopOpacity={1} />
            <Stop offset="55%" stopColor={color} stopOpacity={0.55} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="url(#g)" />
      </Svg>
    </Animated.View>
  );
}

/**
 * The colourful backdrop every screen sits on. Glass only looks like glass
 * when there is something vivid behind it to blur, so this is deliberately
 * saturated. Put it once in a layout; screens inside reuse it.
 */
export function Backdrop({ children }: { children: ReactNode }) {
  const t = useTheme();
  const target = useRef<HostInstance>(null);
  return (
    <View style={[styles.root, { backgroundColor: t.bg }]}>
      <BlurTargetView ref={target} style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[StyleSheet.absoluteFill, { backgroundColor: t.bg }]} />
        <Orb color={t.blob1} size={460} x={-190} y={-150} dx={70} dy={50} duration={8000} />
        <Orb color={t.blob2} size={440} x={120} y={90} dx={-80} dy={70} duration={10000} />
        <Orb color={t.blob3} size={420} x={-150} y={470} dx={60} dy={-60} duration={12000} />
        <Orb color={t.blob4} size={380} x={140} y={620} dx={-60} dy={-50} duration={9000} />
      </BlurTargetView>
      <BlurTargetContext.Provider value={target}>{children}</BlurTargetContext.Provider>
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
