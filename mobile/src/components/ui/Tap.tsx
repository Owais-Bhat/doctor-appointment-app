import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { Platform, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

export function haptic(style: 'light' | 'medium' | 'success' = 'light') {
  if (Platform.OS === 'web') return;
  try {
    if (style === 'success') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else void Haptics.impactAsync(style === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // haptics are a nicety, never an error
  }
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type TapProps = {
  onPress?: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  /** Scale while pressed. */
  scaleTo?: number;
  buzz?: boolean;
  label?: string;
  hitSlop?: number;
};

/** Anything tappable: springs down while pressed and gives a light haptic tick. */
export function Tap({ onPress, children, style, disabled, scaleTo = 0.96, buzz = true, label, hitSlop }: TapProps) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      hitSlop={hitSlop}
      onPressIn={() => (scale.value = withSpring(scaleTo, { damping: 15, stiffness: 400 }))}
      onPressOut={() => (scale.value = withSpring(1, { damping: 12, stiffness: 300 }))}
      style={[style, anim, disabled && { opacity: 0.5 }]}
      onPress={() => {
        if (buzz) haptic('light');
        onPress?.();
      }}>
      {children}
    </AnimatedPressable>
  );
}
