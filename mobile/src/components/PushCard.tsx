import { View } from 'react-native';

import { usePush } from '@/lib/use-push';

import { AnimatedIcon } from './icons/Icon';
import { Button } from './ui/Button';
import { GlassCard } from './ui/GlassCard';
import { Text } from './ui/Text';

/**
 * Asks once to turn on notifications; draws nothing when they are already on,
 * refused, or not possible in this build. Using it also registers the phone
 * with the server when permission was given earlier.
 */
export function PushCard({ body }: { body: string }) {
  const push = usePush();
  if (push.status !== 'undetermined') return null;
  return (
    <GlassCard padding={16}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <AnimatedIcon name="bell" size={30} strokeWidth={1.6} />
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">Turn on notifications</Text>
          <Text variant="small" tone="ink2">
            {body}
          </Text>
        </View>
        <Button size="sm" title="Turn on" loading={push.busy} onPress={push.enable} />
      </View>
    </GlassCard>
  );
}
