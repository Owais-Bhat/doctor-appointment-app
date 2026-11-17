import { useColorScheme } from 'react-native';

import { Colors, type ThemeColors } from '@/constants/theme';
import { useThemePref } from '@/lib/theme-pref';

/** Light or dark palette: the person's choice, or the phone's setting. */
export function useTheme(): ThemeColors & { isDark: boolean } {
  const system = useColorScheme();
  const pref = useThemePref();
  const isDark = (pref === 'system' ? system : pref) === 'dark';
  return { ...(isDark ? Colors.dark : Colors.light), isDark };
}
