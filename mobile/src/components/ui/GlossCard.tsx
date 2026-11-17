import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Tap } from './Tap';

type Props = { children: ReactNode; onPress?: () => void; label?: string; style?: StyleProp<ViewStyle>; padding?: number; colors?: [string, string] };

/**
 * The glowing accent card used for the one thing that matters on a screen
 * (next visit, a doctor's header): a saturated glass slab with a gloss band
 * on top and a bright edge.
 */
export function GlossCard({ children, onPress, label, style, padding = 22, colors }: Props) {
  const t = useTheme();
  const [a, b] = colors ?? [t.accent, t.accent2];
  const body = (
    <View style={[{ borderRadius: Radius.card + 2, boxShadow: `0px 16px 36px ${a}66` } as ViewStyle, style]}>
      <LinearGradient
        colors={[a, b]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: Radius.card + 2, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)', overflow: 'hidden' }}>
        <LinearGradient pointerEvents="none" colors={['rgba(255,255,255,0.46)', 'rgba(255,255,255,0.10)', 'rgba(255,255,255,0)']} locations={[0, 0.45, 1]} start={{ x: 0, y: 0 }} end={{ x: 0.55, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={{ padding }}>{children}</View>
      </LinearGradient>
    </View>
  );
  return onPress ? (
    <Tap onPress={onPress} scaleTo={0.98} label={label}>
      {body}
    </Tap>
  ) : (
    body
  );
}
