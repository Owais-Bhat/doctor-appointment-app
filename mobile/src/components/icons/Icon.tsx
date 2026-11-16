import { useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { useTheme } from '@/hooks/use-theme';

import { ICONS, type IconName, type IconPart } from './paths';

type IconProps = {
  name: IconName;
  size?: number;
  /** Outline colour. Defaults to the theme's ink. */
  color?: string;
  /** Accent colour for the duotone parts. Defaults to the theme accent. */
  accent?: string;
  strokeWidth?: number;
  style?: StyleProp<ViewStyle>;
};

function useIconColors(color?: string, accent?: string) {
  const t = useTheme();
  return { color: color ?? t.ink, accent: accent ?? t.accent };
}

/** Static icon. */
export function Icon({ name, size = 24, color, accent, strokeWidth = 1.75, style }: IconProps) {
  const c = useIconColors(color, accent);
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={[{ flexShrink: 0 }, style]}>
      {ICONS[name].map((part: IconPart, i: number) => (
        <Path
          key={i}
          d={part.d}
          stroke={part.a ? c.accent : c.color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={part.f ? c.accent : 'none'}
          fillOpacity={part.f ? 0.16 : 0}
        />
      ))}
    </Svg>
  );
}

const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Longer than any outline on the 24-grid, so the dash is solid once drawn. */
const DASH = 200;

function DrawnPart({
  part,
  progress,
  color,
  accent,
  strokeWidth,
}: {
  part: IconPart;
  progress: SharedValue<number>;
  color: string;
  accent: string;
  strokeWidth: number;
}) {
  const props = useAnimatedProps(() => ({
    strokeDashoffset: DASH * (1 - progress.value),
    // The tint fades in once the outline is nearly drawn
    fillOpacity: part.f ? 0.16 * interpolate(progress.value, [0.25, 0.5], [0, 1], 'clamp') : 0,
  }));
  return (
    <AnimatedPath
      d={part.d}
      stroke={part.a ? accent : color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={`${DASH} ${DASH}`}
      fill={part.f ? accent : 'none'}
      animatedProps={props}
    />
  );
}

type AnimatedIconProps = IconProps & {
  /** Delay before the stroke-draw starts (ms). */
  delay?: number;
  /** Replays a little pop whenever this flips to true (e.g. a selected tab). */
  active?: boolean;
  /** Draw the outline in on mount. Defaults to true. */
  draw?: boolean;
};

/**
 * Icon whose outline draws itself in on mount and pops when it becomes
 * active. Runs on the UI thread (Reanimated), so it stays smooth.
 */
export function AnimatedIcon({
  name,
  size = 24,
  color,
  accent,
  strokeWidth = 1.75,
  style,
  delay = 0,
  active = false,
  draw = true,
}: AnimatedIconProps) {
  const c = useIconColors(color, accent);
  const progress = useSharedValue(draw ? 0 : 1);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (draw) progress.value = withDelay(delay, withTiming(1, { duration: 1400, easing: Easing.out(Easing.cubic) }));
  }, [draw, delay, name, progress]);

  useEffect(() => {
    if (active) scale.value = withSequence(withSpring(1.22, { damping: 6, stiffness: 320 }), withSpring(1, { damping: 10 }));
  }, [active, scale]);

  const pop = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[pop, style]}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {ICONS[name].map((part: IconPart, i: number) => (
          <DrawnPart key={`${name}-${i}`} part={part} progress={progress} color={c.color} accent={c.accent} strokeWidth={strokeWidth} />
        ))}
      </Svg>
    </Animated.View>
  );
}
