import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Fonts, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTr } from '@/lib/i18n';

import { Icon } from '../icons/Icon';
import type { IconName } from '../icons/paths';
import { GlassSurface } from './GlassSurface';
import { Tap } from './Tap';
import { Text } from './Text';

type Props = TextInputProps & { label: string; icon?: IconName; error?: string | null; secure?: boolean };

/** Glass text field with an icon; an accent ring glows in while it has focus. */
export function Field({ label, icon, error, secure, style, onFocus, onBlur, multiline, ...rest }: Props) {
  const t = useTheme();
  const tr = useTr();
  const [hidden, setHidden] = useState(!!secure);
  const focus = useSharedValue(0);
  const ring = useAnimatedStyle(() => ({ opacity: focus.get() }));

  return (
    <View style={{ gap: 7 }}>
      <Text variant="small" tone="ink2" style={{ marginLeft: 6, fontWeight: '700' }}>
        {label}
      </Text>
      <GlassSurface radius={Radius.field} shadow={false} contentStyle={multiline ? undefined : { height: 56 }}>
        <View style={[styles.box, multiline && { minHeight: 96, alignItems: 'flex-start', paddingVertical: 14 }]}>
          {icon ? <Icon name={icon} size={21} color={t.ink3} accent={t.ink3} style={multiline ? { marginTop: 2 } : undefined} /> : null}
          <TextInput
            {...rest}
            multiline={multiline}
            accessibilityLabel={label}
            secureTextEntry={secure ? hidden : rest.secureTextEntry}
            placeholderTextColor={t.ink3}
            placeholder={rest.placeholder ? tr(rest.placeholder) : undefined}
            onFocus={(e) => {
              focus.set(withTiming(1, { duration: 180 }));
              onFocus?.(e);
            }}
            onBlur={(e) => {
              focus.set(withTiming(0, { duration: 180 }));
              onBlur?.(e);
            }}
            style={[styles.input, { color: t.ink, fontFamily: Fonts.sans }, multiline && { textAlignVertical: 'top' }, style, { outlineStyle: 'none' } as object]}
          />
          {secure ? (
            <Tap onPress={() => setHidden((h) => !h)} label={hidden ? 'Show password' : 'Hide password'} hitSlop={10} scaleTo={0.85}>
              <Icon name={hidden ? 'eye' : 'eyeOff'} size={21} color={t.ink3} accent={t.ink3} />
            </Tap>
          ) : null}
        </View>
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: Radius.field, borderWidth: 2, borderColor: error ? t.bad : t.accent }, error ? { opacity: 1 } : ring]} />
      </GlassSurface>
      {error ? (
        <Text variant="small" tone="bad" style={{ marginLeft: 6 }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, height: '100%' },
  input: { flex: 1, minWidth: 0, fontSize: 16.5, height: '100%' },
});
