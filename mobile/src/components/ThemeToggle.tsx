import { setThemePref, useThemePref, type ThemePref } from '@/lib/theme-pref';

import { GlassIconButton } from './Header';
import { Icon } from './icons/Icon';

const NEXT: Record<ThemePref, ThemePref> = { system: 'light', light: 'dark', dark: 'system' };
const ICON = { system: 'monitor', light: 'sun', dark: 'moon' } as const;
const NAME = { system: 'automatic', light: 'light', dark: 'dark' } as const;

/** One tap cycles Auto → Light → Dark. For screens that have no settings page, like sign-in. */
export function ThemeToggle() {
  const pref = useThemePref();
  return (
    <GlassIconButton onPress={() => setThemePref(NEXT[pref])} label={`Theme: ${NAME[pref]}. Tap to change`} size={44}>
      <Icon name={ICON[pref]} size={22} />
    </GlassIconButton>
  );
}
