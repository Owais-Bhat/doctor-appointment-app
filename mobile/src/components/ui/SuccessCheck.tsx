import { useEffect } from 'react';
import Animated, { Easing, useAnimatedProps, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { useTheme } from '@/hooks/use-theme';

import { haptic } from './Tap';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const RING = 2 * Math.PI * 44; // r = 44

/** Ring draws, then the tick, then the whole mark settles with a spring. */
export function SuccessCheck({ size = 120 }: { size?: number }) {
  const t = useTheme();
  const ring = useSharedValue(0);
  const tick = useSharedValue(0);
  const scale = useSharedValue(0.6);

  useEffect(() => {
    ring.set(withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) }));
    tick.set(withDelay(500, withTiming(1, { duration: 450, easing: Easing.out(Easing.cubic) })));
    scale.set(withSpring(1, { damping: 9, stiffness: 140 }));
    const id = setTimeout(() => haptic('success'), 520);
    return () => clearTimeout(id);
  }, [ring, tick, scale]);

  const ringProps = useAnimatedProps(() => ({ strokeDashoffset: RING * (1 - ring.get()) }));
  const tickProps = useAnimatedProps(() => ({ strokeDashoffset: 60 * (1 - tick.get()) }));
  const pop = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  return (
    <Animated.View style={pop}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Circle cx={50} cy={50} r={44} fill={t.good} fillOpacity={0.12} />
        <AnimatedCircle
          cx={50}
          cy={50}
          r={44}
          stroke={t.good}
          strokeWidth={4}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${RING} ${RING}`}
          animatedProps={ringProps}
          rotation={-90}
          origin="50, 50"
        />
        <AnimatedPath
          d="M32 52l12 12 25-27"
          stroke={t.good}
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray="60 60"
          animatedProps={tickProps}
        />
      </Svg>
    </Animated.View>
  );
}
