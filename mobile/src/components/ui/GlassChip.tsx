import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

import { GlassSurface } from './GlassSurface';
import { Tap } from './Tap';
import { Text } from './Text';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** Optional content in place of the label (the label is still the accessibility name). */
  children?: ReactNode;
  height?: number;
  minWidth?: number;
  style?: StyleProp<ViewStyle>;
};

/** A small selectable glass pill: clear when idle, filled with accent glass when selected. */
export function GlassChip({ label, selected, onPress, children, height = 44, minWidth, style }: Props) {
  const t = useTheme();
  return (
    <Tap onPress={onPress} label={label} scaleTo={0.92} style={style}>
      <GlassSurface radius={height / 2} shadow={false} tint={selected ? t.accent : undefined} tintOpacity={0.8} variant={selected ? 'strong' : 'card'}>
        <View style={{ height, minWidth, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' }}>
          {children ?? (
            <Text variant="small" style={{ fontWeight: '800', color: selected ? '#fff' : t.ink }}>
              {label}
            </Text>
          )}
        </View>
      </GlassSurface>
    </Tap>
  );
}
