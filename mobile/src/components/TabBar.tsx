import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';
import { useEffect, useState, type ComponentProps } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { AnimatedIcon } from './icons/Icon';
import type { IconName } from './icons/paths';
import { GlassSurface } from './ui/GlassSurface';
import { Tap } from './ui/Tap';
import { Text } from './ui/Text';

type BottomTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

export type TabMeta = { label: string; icon: IconName; /** Raised glowing centre button. */ primary?: boolean };
export type TabsConfig = Record<string, TabMeta>;

/**
 * Floating liquid-glass tab bar. A glass lens slides under the active tab and
 * stretches as it travels, like the iOS 26 tab bar. Pass the portal's tabs;
 * any route not listed is skipped.
 */
export function GlassTabBar({ state, navigateToTab, tabs }: BottomTabBarProps & { tabs: TabsConfig }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(0);

  const visible = state.routes.filter((r) => tabs[r.name]);
  const activeKey = state.routes[state.index]?.key;
  const active = Math.max(0, visible.findIndex((r) => r.key === activeKey));
  const slot = width / Math.max(1, visible.length);
  const primary = visible.find((r) => tabs[r.name].primary);
  const primaryIndex = primary ? visible.indexOf(primary) : 0;
  // 6 = the row's side padding; the bar itself is 16 in from the screen edge
  const primaryLeft = 6 + primaryIndex * slot + slot / 2 - 31;

  const x = useSharedValue(0);
  const stretch = useSharedValue(1);
  const pulse = useSharedValue(0);

  useEffect(() => {
    const ease = { duration: 1500, easing: Easing.inOut(Easing.sin) };
    pulse.set(withRepeat(withSequence(withTiming(1, ease), withTiming(0, ease)), -1));
  }, [pulse]);

  useEffect(() => {
    x.set(withSpring(active * slot, { damping: 15, stiffness: 180 }));
    // the lens elongates while it moves, then settles — the "liquid" part
    stretch.set(withSequence(withTiming(1.28, { duration: 130 }), withSpring(1, { damping: 11, stiffness: 160 })));
  }, [active, slot, x, stretch]);

  const lens = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }, { scaleX: stretch.get() }], width: slot }));
  const halo = useAnimatedStyle(() => ({ opacity: 0.4 * (1 - pulse.get()), transform: [{ scale: 1 + 0.55 * pulse.get() }] }));

  return (
    <View style={[styles.outer, { bottom: Math.max(insets.bottom, 12) }]} pointerEvents="box-none">
      <View style={styles.bar}>
      <GlassSurface radius={36} variant="strong" intensity={90}>
        <View style={styles.row} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
          {width > 0 ? (
            <Animated.View pointerEvents="none" style={[styles.lensSlot, lens]}>
              <View style={[styles.lens, { backgroundColor: t.lens, borderColor: t.edgeA, boxShadow: `0px 6px 18px ${t.shadow}` } as ViewStyle]} />
            </Animated.View>
          ) : null}

          {visible.map((route) => {
            const tab = tabs[route.name];
            const focused = route.key === activeKey;
            // The raised button is drawn above the bar (below); here it only keeps its place
            if (tab.primary) return <View key={route.key} style={styles.slot} />;
            return (
              <Tap key={route.key} onPress={() => !focused && navigateToTab(route.key)} style={styles.slot} scaleTo={0.88} label={tab.label}>
                <View style={styles.item}>
                  <AnimatedIcon name={tab.icon} size={25} color={focused ? t.ink : t.ink3} accent={focused ? t.accent : t.ink3} active={focused} draw={false} />
                  <Text variant="caption" style={{ fontSize: 10.5, letterSpacing: 0.1, textTransform: 'none', fontWeight: focused ? '800' : '600' }} tone={focused ? 'ink' : 'ink3'}>
                    {tab.label}
                  </Text>
                </View>
              </Tap>
            );
          })}
        </View>
      </GlassSurface>

      {primary && width > 0 ? (
        <View pointerEvents="box-none" style={[styles.primaryLayer, { left: primaryLeft }]}>
          <Tap onPress={() => navigateToTab(primary.key)} scaleTo={0.9} label={tabs[primary.name].label}>
            <View style={styles.centreWrap}>
              <Animated.View style={[styles.halo, { backgroundColor: t.accent }, halo]} />
              <LinearGradient colors={[t.accent, t.accent2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.centre, { boxShadow: `0px 12px 26px ${t.accent}80`, overflow: 'hidden' } as ViewStyle]}>
                <LinearGradient pointerEvents="none" colors={['rgba(255,255,255,0.5)', 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0)']} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />
                <AnimatedIcon name={tabs[primary.name].icon} size={29} color="#fff" accent="#fff" strokeWidth={2.3} active={activeKey === primary.key} draw={false} />
              </LinearGradient>
            </View>
          </Tap>
        </View>
      ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { position: 'absolute', left: 0, right: 0, alignItems: 'center', paddingHorizontal: 16 },
  bar: { width: '100%', maxWidth: MaxContentWidth - 40 },
  row: { flexDirection: 'row', height: 74, paddingHorizontal: 6 },
  slot: { flex: 1, height: 74, alignItems: 'center', justifyContent: 'center' },
  item: { alignItems: 'center', gap: 3 },
  lensSlot: { position: 'absolute', top: 0, bottom: 0, left: 6, alignItems: 'center', justifyContent: 'center' },
  lens: { width: '84%', height: 58, borderRadius: 29, borderWidth: 1 },
  primaryLayer: { position: 'absolute', top: -22, width: 62 },
  centreWrap: { alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', width: 62, height: 62, borderRadius: 31 },
  centre: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.6)' },
});
