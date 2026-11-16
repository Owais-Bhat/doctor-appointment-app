import { View } from 'react-native';

import { Button } from './ui/Button';
import { GlassCard } from './ui/GlassCard';
import { Skeleton } from './ui/Skeleton';
import { Text } from './ui/Text';
import { AnimatedIcon } from './icons/Icon';
import type { IconName } from './icons/paths';
import { Reveal } from './ui/Reveal';

export function EmptyState({ icon, title, body, action }: { icon: IconName; title: string; body?: string; action?: { title: string; onPress: () => void } }) {
  return (
    <Reveal style={{ alignItems: 'center', gap: 10, paddingVertical: 36 }}>
      <AnimatedIcon name={icon} size={56} strokeWidth={1.5} />
      <Text variant="h2" style={{ textAlign: 'center' }}>
        {title}
      </Text>
      {body ? (
        <Text tone="ink2" style={{ textAlign: 'center', maxWidth: 300 }}>
          {body}
        </Text>
      ) : null}
      {action ? <Button title={action.title} size="sm" onPress={action.onPress} style={{ marginTop: 6 }} /> : null}
    </Reveal>
  );
}

export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <GlassCard padding={16}>
      <View style={{ gap: 10 }}>
        <Text tone="bad" style={{ fontWeight: '600' }}>
          {message}
        </Text>
        {onRetry ? <Button title="Try again" size="sm" variant="soft" onPress={onRetry} style={{ alignSelf: 'flex-start' }} /> : null}
      </View>
    </GlassCard>
  );
}

/** Placeholder rows shaped like a card while a list loads. */
export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <View style={{ gap: 14 }}>
      {Array.from({ length: rows }, (_, i) => (
        <GlassCard key={i} padding={16}>
          <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
            <Skeleton width={56} height={56} radius={28} />
            <View style={{ flex: 1, gap: 8 }}>
              <Skeleton width="60%" height={16} />
              <Skeleton width="40%" height={12} />
              <Skeleton width="30%" height={12} />
            </View>
          </View>
        </GlassCard>
      ))}
    </View>
  );
}
