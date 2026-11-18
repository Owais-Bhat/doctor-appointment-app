import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTr } from '@/lib/i18n';

const VARIANTS = {
  display: { fontSize: 34, lineHeight: 40, fontWeight: '700', letterSpacing: -0.9 },
  title: { fontSize: 26, lineHeight: 32, fontWeight: '700', letterSpacing: -0.6 },
  h2: { fontSize: 19, lineHeight: 25, fontWeight: '700', letterSpacing: -0.3 },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: '600' },
  small: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  caption: { fontSize: 11.5, lineHeight: 15, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase' },
} as const;

export type TextVariant = keyof typeof VARIANTS;

type Props = RNTextProps & { variant?: TextVariant; tone?: 'ink' | 'ink2' | 'ink3' | 'accent' | 'good' | 'bad' | 'warn' | 'onAccent' };

export function Text({ variant = 'body', tone = 'ink', style, children, ...rest }: Props) {
  const t = useTheme();
  const tr = useTr();
  const color = tone === 'onAccent' ? t.accentInk : t[tone];
  // Fixed words are shown in the chosen language; anything with a name or number in it stays as written
  return (
    <RNText {...rest} style={[{ fontFamily: Fonts.sans, color }, VARIANTS[variant], style]}>
      {typeof children === 'string' ? tr(children) : children}
    </RNText>
  );
}
