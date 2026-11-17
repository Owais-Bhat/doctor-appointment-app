import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { Radius } from '@/constants/theme';

import { GlassSurface } from './GlassSurface';
import { Tap } from './Tap';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  padding?: number;
  label?: string;
  tint?: string;
  radius?: number;
  /** Turn the drop shadow off, e.g. inside a horizontal list that would clip it. */
  shadow?: boolean;
};

/** Everyday liquid-glass card. Tappable (springs down) when `onPress` is given. */
export function GlassCard({ children, style, onPress, padding = 18, label, tint, radius = Radius.card, shadow = true }: Props) {
  const body = (
    <GlassSurface radius={radius} padding={padding} tint={tint} style={style} shadow={shadow}>
      {children}
    </GlassSurface>
  );
  return onPress ? (
    <Tap onPress={onPress} scaleTo={0.975} label={label}>
      {body}
    </Tap>
  ) : (
    body
  );
}
