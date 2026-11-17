import { GlassCard } from './ui/GlassCard';
import { Segmented } from './ui/Segmented';
import { Text } from './ui/Text';
import { setThemePref, useThemePref, type ThemePref } from '@/lib/theme-pref';
import { View } from 'react-native';

const OPTIONS = [
  { value: 'system', label: 'Auto', icon: 'monitor' },
  { value: 'light', label: 'Light', icon: 'sun' },
  { value: 'dark', label: 'Dark', icon: 'moon' },
] as const;

/** Light / dark / follow-the-phone switch. Applies instantly and is remembered. */
export function AppearanceCard() {
  const pref = useThemePref();
  return (
    <GlassCard padding={16}>
      <View style={{ gap: 12 }}>
        <View>
          <Text variant="bodyStrong">Appearance</Text>
          <Text variant="small" tone="ink2">
            Choose light or dark, or follow your phone.
          </Text>
        </View>
        <Segmented<ThemePref> options={OPTIONS} value={pref} onChange={setThemePref} />
      </View>
    </GlassCard>
  );
}
