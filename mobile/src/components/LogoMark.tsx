import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { AnimatedIcon } from './icons/Icon';

/** The MedFlow mark: a gradient tile with a heart-pulse that draws itself and then breathes. */
export function LogoMark({ size = 84 }: { size?: number }) {
  const pop = useSharedValue(0);
  const breathe = useSharedValue(0);

  useEffect(() => {
    pop.set(withSpring(1, { damping: 11, stiffness: 120 }));
    breathe.set(withDelay(1200, withRepeat(withSequence(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 1100, easing: Easing.inOut(Easing.sin) })), -1)));
  }, [pop, breathe]);

  const style = useAnimatedStyle(() => ({
    opacity: pop.get(),
    transform: [{ scale: (0.5 + 0.5 * pop.get()) * (1 + 0.04 * breathe.get()) }, { rotate: `${(1 - pop.get()) * -12}deg` }],
  }));

  return (
    <Animated.View style={style}>
      <LinearGradient
        colors={['#007AFF', '#5856d6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ width: size, height: size, borderRadius: size * 0.3, alignItems: 'center', justifyContent: 'center' }}>
        <AnimatedIcon name="heart" size={size * 0.56} color="#fff" accent="#fff" strokeWidth={1.9} delay={250} />
      </LinearGradient>
    </Animated.View>
  );
}
