import { View } from 'react-native';

import { Icon } from './icons/Icon';
import type { IconName } from './icons/paths';
import { GlassCard } from './ui/GlassCard';
import { Text } from './ui/Text';

/** One number with a label, in glass. Tiles sit two per row. */
export function StatTile({ icon, value, label, hint, tint }: { icon: IconName; value: string; label: string; hint?: string; tint?: string }) {
  return (
    <GlassCard padding={16} style={{ flexGrow: 1 }} tint={tint}>
      <View style={{ gap: 10 }}>
        <Icon name={icon} size={26} strokeWidth={1.6} />
        <View>
          <Text variant="title" style={{ fontSize: 26, lineHeight: 30 }}>
            {value}
          </Text>
          <Text variant="small" tone="ink2" style={{ fontWeight: '600' }}>
            {label}
          </Text>
          {hint ? (
            <Text variant="small" tone="ink3" style={{ fontSize: 11.5 }}>
              {hint}
            </Text>
          ) : null}
        </View>
      </View>
    </GlassCard>
  );
}
