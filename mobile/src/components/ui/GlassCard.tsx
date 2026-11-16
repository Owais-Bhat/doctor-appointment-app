import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Tap } from './Tap';

type Props = { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; padding?: number; label?: string };

/** Frosted-glass surface, like the web app's cards. Tappable when `onPress` is given. */
export function GlassCard({ children, style, onPress, padding = 18, label }: Props) {
  const t = useTheme();
  const body = (
    <View style={[styles.card, { borderColor: t.line, backgroundColor: t.card }, style]}>
      <BlurView intensity={t.isDark ? 30 : 45} tint={t.blur} style={StyleSheet.absoluteFill} />
      <View style={{ padding }}>{children}</View>
    </View>
  );
  return onPress ? (
    <Tap onPress={onPress} scaleTo={0.975} label={label}>
      {body}
    </Tap>
  ) : (
    body
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: Radius.card, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
});
