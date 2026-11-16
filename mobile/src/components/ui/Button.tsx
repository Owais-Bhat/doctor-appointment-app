import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Icon } from '../icons/Icon';
import type { IconName } from '../icons/paths';
import { Tap } from './Tap';
import { Text } from './Text';

type Props = {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'soft' | 'ghost' | 'danger';
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  size?: 'md' | 'sm';
};

export function Button({ title, onPress, variant = 'primary', icon, loading, disabled, style, size = 'md' }: Props) {
  const t = useTheme();
  const height = size === 'sm' ? 40 : 54;
  const inactive = disabled || loading;

  const fg = variant === 'primary' ? t.accentInk : variant === 'danger' ? t.bad : t.accent;
  const content = (
    <View style={[styles.row, { height }]}>
      {loading ? <ActivityIndicator color={fg} /> : icon ? <Icon name={icon} size={size === 'sm' ? 17 : 20} color={fg} accent={fg} /> : null}
      <Text variant="bodyStrong" style={{ color: fg, fontSize: size === 'sm' ? 14 : 16 }}>
        {title}
      </Text>
    </View>
  );

  return (
    <Tap onPress={onPress} disabled={inactive} label={title} scaleTo={0.97} style={[{ borderRadius: Radius.pill, overflow: 'hidden' }, style]}>
      {variant === 'primary' ? (
        <LinearGradient colors={[t.accent, t.accent2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          {content}
        </LinearGradient>
      ) : (
        <View
          style={{
            borderRadius: Radius.pill,
            backgroundColor: variant === 'ghost' ? 'transparent' : variant === 'danger' ? `${t.bad}1f` : `${t.accent}1a`,
            borderWidth: variant === 'ghost' ? StyleSheet.hairlineWidth : 0,
            borderColor: t.line2,
          }}>
          {content}
        </View>
      )}
    </Tap>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 22 },
});
