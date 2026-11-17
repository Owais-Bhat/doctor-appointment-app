import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

import { Icon } from '../icons/Icon';
import type { IconName } from '../icons/paths';
import { GlassSurface } from './GlassSurface';
import { Tap } from './Tap';
import { Text } from './Text';

type Props = {
  title: string;
  onPress?: () => void;
  /** primary = glowing accent glass; soft/ghost/danger = clear glass with a tint. */
  variant?: 'primary' | 'soft' | 'ghost' | 'danger';
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  size?: 'md' | 'sm';
};

export function Button({ title, onPress, variant = 'primary', icon, loading, disabled, style, size = 'md' }: Props) {
  const t = useTheme();
  const height = size === 'sm' ? 42 : 56;
  const inactive = disabled || loading;
  const radius = height / 2;

  const fg = variant === 'primary' ? t.accentInk : variant === 'danger' ? t.bad : t.ink;
  const iconAccent = variant === 'primary' ? t.accentInk : variant === 'danger' ? t.bad : t.accent;

  const content = (
    <View style={[styles.row, { height }]}>
      {loading ? <ActivityIndicator color={fg} /> : icon ? <Icon name={icon} size={size === 'sm' ? 18 : 21} color={fg} accent={iconAccent} /> : null}
      <Text variant="bodyStrong" style={{ color: fg, fontSize: size === 'sm' ? 14 : 16.5, letterSpacing: -0.2 }}>
        {title}
      </Text>
    </View>
  );

  return (
    <Tap onPress={onPress} disabled={inactive} label={title} scaleTo={0.96} style={style}>
      {variant === 'primary' ? (
        <View style={{ borderRadius: radius, boxShadow: `0px 10px 26px ${t.accent}66` } as ViewStyle}>
          <LinearGradient
            colors={[t.accent, t.accent2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: radius, borderWidth: StyleSheet.hairlineWidth * 2, borderColor: 'rgba(255,255,255,0.55)', overflow: 'hidden' }}>
            {/* gloss: a bright band across the top half, like light on a glass bead */}
            <LinearGradient pointerEvents="none" colors={['rgba(255,255,255,0.45)', 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0)']} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />
            {content}
          </LinearGradient>
        </View>
      ) : (
        <GlassSurface radius={radius} variant="strong" tint={variant === 'danger' ? t.bad : variant === 'soft' ? t.accent : undefined} tintOpacity={0.2} shadow={false}>
          {content}
        </GlassSurface>
      )}
    </Tap>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingHorizontal: 24 },
});
