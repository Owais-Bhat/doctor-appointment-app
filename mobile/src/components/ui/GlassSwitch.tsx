import { View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useDerivedValue, withSpring } from 'react-native-reanimated';

import { useTheme } from '@/hooks/use-theme';

import { Tap } from './Tap';

/** On/off switch: a glass capsule with a glass bead that springs across. */
export function GlassSwitch({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  const t = useTheme();
  const x = useDerivedValue(() => withSpring(value ? 22 : 0, { damping: 14, stiffness: 220 }), [value]);
  const bead = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));
  return (
    <Tap onPress={() => onChange(!value)} label={label} scaleTo={0.92} hitSlop={8}>
      <View
        style={{
          width: 56,
          height: 34,
          borderRadius: 17,
          padding: 3,
          backgroundColor: value ? `${t.good}cc` : t.line2,
          borderWidth: 1,
          borderColor: value ? 'rgba(255,255,255,0.5)' : t.line,
        }}>
        <Animated.View style={[{ width: 26, height: 26, borderRadius: 13, backgroundColor: '#fff', boxShadow: '0px 3px 8px rgba(0,0,0,0.28)' } as ViewStyle, bead]} />
      </View>
    </Tap>
  );
}
