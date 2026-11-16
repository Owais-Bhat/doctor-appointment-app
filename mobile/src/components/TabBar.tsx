import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';
import { useEffect, useState, type ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { AnimatedIcon } from './icons/Icon';
import type { IconName } from './icons/paths';
import { Tap } from './ui/Tap';
import { Text } from './ui/Text';

type BottomTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const TABS: Record<string, { label: string; icon: IconName }> = {
  home: { label: 'Home', icon: 'home' },
  visits: { label: 'Visits', icon: 'calendar' },
  book: { label: 'Book', icon: 'plus' },
  doctors: { label: 'Doctors', icon: 'stethoscope' },
  profile: { label: 'Me', icon: 'user' },
};

/** Floating glass tab bar: a pill slides under the active tab and the centre button pulses. */
export function TabBar({ state, navigateToTab }: BottomTabBarProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(0);
  const slot = width / state.routes.length;

  const x = useSharedValue(0);
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withSequence(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.sin) })), -1);
  }, [pulse]);

  useEffect(() => {
    x.value = withSpring(state.index * slot, { damping: 16, stiffness: 190 });
  }, [state.index, slot, x]);
  const indicator = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }], width: slot }));
  const halo = useAnimatedStyle(() => ({ opacity: 0.35 * (1 - pulse.value), transform: [{ scale: 1 + 0.5 * pulse.value }] }));

  return (
    <View style={[styles.outer, { bottom: Math.max(insets.bottom, 12) }]} pointerEvents="box-none">
      <View style={[styles.bar, { borderColor: t.line, backgroundColor: t.card }]} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        <View style={[StyleSheet.absoluteFill, { borderRadius: 30, overflow: 'hidden' }]} pointerEvents="none">
          <BlurView intensity={t.isDark ? 50 : 70} tint={t.blur} style={StyleSheet.absoluteFill} />
        </View>
        {width > 0 ? (
          <Animated.View style={[styles.indicatorSlot, indicator]} pointerEvents="none">
            <View style={[styles.indicator, { backgroundColor: `${t.accent}1f` }]} />
          </Animated.View>
        ) : null}

        <View style={styles.row}>
          {state.routes.map((route, i) => {
            const tab = TABS[route.name];
            if (!tab) return <View key={route.key} style={styles.slot} />;
            const focused = state.index === i;
            const centre = route.name === 'book';

            const onPress = () => {
              if (!focused) navigateToTab(route.key);
            };

            return (
              <Tap key={route.key} onPress={onPress} style={styles.slot} scaleTo={centre ? 0.9 : 0.88} label={tab.label}>
                {centre ? (
                  <View style={styles.centreWrap}>
                    <Animated.View style={[styles.halo, { backgroundColor: t.accent }, halo]} />
                    <LinearGradient colors={[t.accent, t.accent2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.centre}>
                      <AnimatedIcon name="plus" size={28} color="#fff" accent="#fff" strokeWidth={2.2} active={focused} draw={false} />
                    </LinearGradient>
                  </View>
                ) : (
                  <View style={styles.item}>
                    <AnimatedIcon
                      name={tab.icon}
                      size={24}
                      color={focused ? t.ink : t.ink3}
                      accent={focused ? t.accent : t.ink3}
                      active={focused}
                      draw={false}
                    />
                    <Text variant="caption" style={{ fontSize: 10, letterSpacing: 0.2, textTransform: 'none' }} tone={focused ? 'accent' : 'ink3'}>
                      {tab.label}
                    </Text>
                  </View>
                )}
              </Tap>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { position: 'absolute', left: 0, right: 0, alignItems: 'center', paddingHorizontal: 16 },
  bar: { width: '100%', maxWidth: MaxContentWidth - 40, height: 70, borderRadius: 30, borderWidth: StyleSheet.hairlineWidth, overflow: 'visible' },
  row: { flexDirection: 'row', flex: 1 },
  slot: { flex: 1, height: 70, alignItems: 'center', justifyContent: 'center' },
  item: { alignItems: 'center', gap: 3 },
  indicatorSlot: { position: 'absolute', top: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
  indicator: { width: '78%', height: 52, borderRadius: 22 },
  centreWrap: { marginTop: -26, alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', width: 60, height: 60, borderRadius: 30 },
  centre: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', shadowColor: '#007AFF', shadowOpacity: 0.45, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
});
