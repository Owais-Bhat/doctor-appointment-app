import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

import { useBlurTarget } from './Backdrop';

export type GlassSurfaceProps = {
  children?: ReactNode;
  /** Corner radius. Use a large number for a capsule. */
  radius?: number;
  /** "card" is the everyday glass; "strong" is thicker (tab bar, sheets, buttons). */
  variant?: 'card' | 'strong';
  /** A colour poured into the glass, e.g. the accent for a selected chip. */
  tint?: string;
  tintOpacity?: number;
  /** Inner padding. */
  padding?: number;
  /** Blur strength 1–100. */
  intensity?: number;
  /** Lets a surface that sits above other glass skip its drop shadow. */
  shadow?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

/**
 * Liquid-glass material: a real blur of what is behind it, a faint tint, a
 * bright specular sheen on the top-left, a thin light edge that fades towards
 * the bottom-right and a soft shadow. Everything translucent in the app is
 * built from this.
 */
export function GlassSurface({
  children,
  radius = 30,
  variant = 'card',
  tint,
  tintOpacity = 0.22,
  padding = 0,
  intensity,
  shadow = true,
  style,
  contentStyle,
}: GlassSurfaceProps) {
  const t = useTheme();
  const target = useBlurTarget();
  const strong = variant === 'strong';
  const blur = intensity ?? (strong ? 80 : 60);

  return (
    <View
      style={[
        { borderRadius: radius },
        // Soft, slightly blue shadow lifts the glass off the backdrop
        shadow && ({ boxShadow: `0px 10px 30px ${t.shadow}` } as ViewStyle),
        style,
      ]}>
      <LinearGradient colors={[t.edgeA, t.edgeB, t.edgeA]} locations={[0, 0.55, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: radius, padding: StyleSheet.hairlineWidth * 2 }}>
        <View style={{ borderRadius: Math.max(0, radius - 1), overflow: 'hidden' }}>
          <BlurView
            intensity={blur}
            tint={t.blur}
            blurTarget={target ?? undefined}
            blurMethod={Platform.OS === 'android' && target ? 'dimezisBlurView' : undefined}
            blurReductionFactor={3}
            style={[StyleSheet.absoluteFill, { borderRadius: Math.max(0, radius - 1) }]}
          />
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: strong ? t.glassStrong : t.glassFill }]} />
          {tint ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: tint, opacity: tintOpacity }]} /> : null}
          <LinearGradient pointerEvents="none" colors={[t.sheen, 'transparent']} locations={[0, 1]} start={{ x: 0, y: 0 }} end={{ x: 0.75, y: 0.55 }} style={[StyleSheet.absoluteFill, { opacity: strong ? 0.9 : 0.6 }]} />
          <View style={[{ padding }, contentStyle]}>{children}</View>
        </View>
      </LinearGradient>
    </View>
  );
}
