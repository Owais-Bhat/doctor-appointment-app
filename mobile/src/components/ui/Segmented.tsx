import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { useTheme } from '@/hooks/use-theme';

import { Icon } from '../icons/Icon';
import type { IconName } from '../icons/paths';
import { Tap } from './Tap';
import { Text } from './Text';

type Option<T extends string> = { value: T; label: string; icon?: IconName };

/** Pill switcher with a highlight that slides (spring) to the chosen option. */
export function Segmented<T extends string>({ options, value, onChange }: { options: readonly Option<T>[]; value: T; onChange: (v: T) => void }) {
  const t = useTheme();
  const [width, setWidth] = useState(0);
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const slot = width / options.length;
  const x = useSharedValue(0);

  // Follow the selection (and re-measure after layout)
  useEffect(() => {
    x.value = withSpring(index * slot, { damping: 18, stiffness: 220 });
  }, [index, slot, x]);
  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }], width: slot }));

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width - 8)} style={[styles.wrap, { backgroundColor: t.line, borderColor: t.line }]}>
      <View style={styles.inner}>
        {width > 0 ? <Animated.View style={[styles.pill, { backgroundColor: t.cardSolid }, pill]} /> : null}
        {options.map((o) => {
          const on = o.value === value;
          return (
            <Tap key={o.value} onPress={() => onChange(o.value)} style={styles.option} scaleTo={0.94} label={o.label}>
              {o.icon ? <Icon name={o.icon} size={17} color={on ? t.ink : t.ink3} accent={on ? t.accent : t.ink3} /> : null}
              <Text variant="small" tone={on ? 'ink' : 'ink3'} style={{ fontWeight: '700' }}>
                {o.label}
              </Text>
            </Tap>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 18, padding: 4, borderWidth: StyleSheet.hairlineWidth },
  inner: { flexDirection: 'row' },
  pill: { position: 'absolute', top: 0, bottom: 0, left: 0, borderRadius: 14 },
  option: { flex: 1, height: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
});
