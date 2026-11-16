import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

/** Fades and springs its child up into place. Give list items an increasing `index` to stagger them. */
export function Reveal({ children, index = 0, style }: { children: ReactNode; index?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 10) * 65).springify().damping(18).stiffness(140)} style={style}>
      {children}
    </Animated.View>
  );
}
