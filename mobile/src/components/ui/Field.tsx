import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Fonts, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Icon } from '../icons/Icon';
import type { IconName } from '../icons/paths';
import { Tap } from './Tap';
import { Text } from './Text';

type Props = TextInputProps & { label: string; icon?: IconName; error?: string | null; secure?: boolean };

/** Text input with an icon, a focus ring that animates in, and a show/hide toggle for passwords. */
export function Field({ label, icon, error, secure, style, onFocus, onBlur, ...rest }: Props) {
  const t = useTheme();
  const [hidden, setHidden] = useState(!!secure);
  const focus = useSharedValue(0);

  const ring = useAnimatedStyle(() => ({
    borderColor: error ? t.bad : interpolateColor(focus.get(), [0, 1], [t.line2, t.accent]),
    borderWidth: 1 + focus.get() * 0.8,
    backgroundColor: interpolateColor(focus.get(), [0, 1], [t.card, t.cardSolid]),
  }));

  return (
    <View style={{ gap: 6 }}>
      <Text variant="small" tone="ink2" style={{ marginLeft: 4, fontWeight: '600' }}>
        {label}
      </Text>
      <Animated.View style={[styles.box, ring]}>
        {icon ? <Icon name={icon} size={20} color={t.ink3} accent={t.ink3} /> : null}
        <TextInput
          {...rest}
          accessibilityLabel={label}
          secureTextEntry={secure ? hidden : rest.secureTextEntry}
          placeholderTextColor={t.ink3}
          onFocus={(e) => {
            focus.set(withTiming(1, { duration: 180 }));
            onFocus?.(e);
          }}
          onBlur={(e) => {
            focus.set(withTiming(0, { duration: 180 }));
            onBlur?.(e);
          }}
          style={[styles.input, { color: t.ink, fontFamily: Fonts.sans }, style, { outlineStyle: 'none' } as object]}
        />
        {secure ? (
          <Tap onPress={() => setHidden((h) => !h)} label={hidden ? 'Show password' : 'Hide password'} hitSlop={10} scaleTo={0.85}>
            <Icon name={hidden ? 'eye' : 'eyeOff'} size={20} color={t.ink3} accent={t.ink3} />
          </Tap>
        ) : null}
      </Animated.View>
      {error ? (
        <Text variant="small" tone="bad" style={{ marginLeft: 4 }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 54, paddingHorizontal: 16, borderRadius: Radius.field },
  input: { flex: 1, minWidth: 0, fontSize: 16, height: '100%' },
});
