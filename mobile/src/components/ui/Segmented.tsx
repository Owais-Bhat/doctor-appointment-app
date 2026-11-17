import { useEffect, useState } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { useTheme } from '@/hooks/use-theme';

import { Icon } from '../icons/Icon';
import type { IconName } from '../icons/paths';
import { GlassSurface } from './GlassSurface';
import { Tap } from './Tap';
import { Text } from './Text';

type Option<T extends string> = { value: T; label: string; icon?: IconName };

/** Glass switch. The selected option sits in a glass lens that slides across and stretches as it moves. */
export function Segmented<T extends string>({ options, value, onChange }: { options: readonly Option<T>[]; value: T; onChange: (v: T) => void }) {
  const t = useTheme();
  const [width, setWidth] = useState(0);
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const slot = width / options.length;
  const x = useSharedValue(0);
  const stretch = useSharedValue(1);

  useEffect(() => {
    x.set(withSpring(index * slot, { damping: 17, stiffness: 210 }));
    stretch.set(withSequence(withTiming(1.12, { duration: 120 }), withSpring(1, { damping: 12 })));
  }, [index, slot, x, stretch]);
  const lens = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }, { scaleX: stretch.get() }], width: slot }));

  return (
    <GlassSurface radius={26} shadow={false} padding={4}>
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={styles.inner}>
        {width > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[styles.lens, { backgroundColor: t.lens, borderColor: t.edgeA, boxShadow: `0px 4px 14px ${t.shadow}` } as ViewStyle, lens]}
          />
        ) : null}
        {options.map((o) => {
          const on = o.value === value;
          return (
            <Tap key={o.value} onPress={() => onChange(o.value)} style={styles.option} scaleTo={0.94} label={o.label}>
              {o.icon ? <Icon name={o.icon} size={18} color={on ? (t.isDark ? t.ink : '#0b1020') : t.ink3} accent={on ? t.accent : t.ink3} /> : null}
              <Text variant="small" style={{ fontWeight: '800', color: on ? (t.isDark ? t.ink : '#0b1020') : t.ink3 }}>
                {o.label}
              </Text>
            </Tap>
          );
        })}
      </View>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  inner: { flexDirection: 'row' },
  lens: { position: 'absolute', top: 0, bottom: 0, left: 0, borderRadius: 22, borderWidth: 1 },
  option: { flex: 1, height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
});
