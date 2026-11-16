import { useColorScheme } from 'react-native';

import { Colors, type ThemeColors } from '@/constants/theme';

/** Light or dark palette, following the phone's setting. */
export function useTheme(): ThemeColors & { isDark: boolean } {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return { ...(isDark ? Colors.dark : Colors.light), isDark };
}
