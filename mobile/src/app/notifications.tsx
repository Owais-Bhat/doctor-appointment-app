import { useState } from 'react';
import { View } from 'react-native';

import { Header } from '@/components/Header';
import { Icon } from '@/components/icons/Icon';
import type { IconName } from '@/components/icons/paths';
import { EmptyState, ErrorNote, ListSkeleton } from '@/components/States';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Reveal } from '@/components/ui/Reveal';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { relativeTime } from '@/lib/format';
import type { AppNotification } from '@/lib/types';
import { useApi } from '@/lib/use-api';

const TYPE: Record<AppNotification['type'], { icon: IconName; tone: 'accent' | 'good' | 'warn' }> = {
  info: { icon: 'info', tone: 'accent' },
  success: { icon: 'check', tone: 'good' },
  warning: { icon: 'alert', tone: 'warn' },
  reminder: { icon: 'clock', tone: 'warn' },
};

export default function Notifications() {
  const t = useTheme();
  const { data, loading, error, refreshing, refresh, reload } = useApi<{ notifications: AppNotification[] }>('/api/patient/notifications');
  const [read, setRead] = useState<Set<string>>(new Set());

  const items = (data?.notifications ?? []).map((n) => ({ ...n, is_read: n.is_read || read.has(n.id) }));
  const unread = items.filter((n) => !n.is_read).length;

  async function markOne(id: string) {
    setRead((s) => new Set(s).add(id));
    await api('/api/patient/notifications', { method: 'PATCH', body: { id } }).catch(() => undefined);
  }

  async function markAll() {
    setRead(new Set(items.map((n) => n.id)));
    await api('/api/patient/notifications', { method: 'PATCH', body: { all: true } }).catch(() => undefined);
  }

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      <Reveal>
        <Header title="Notifications" subtitle={unread ? `${unread} unread` : 'You’re all caught up'} back />
      </Reveal>
      {unread > 0 ? (
        <Reveal index={1}>
          <Button title="Mark all as read" size="sm" variant="soft" icon="check" onPress={markAll} style={{ alignSelf: 'flex-start' }} />
        </Reveal>
      ) : null}

      {loading ? (
        <ListSkeleton />
      ) : error ? (
        <ErrorNote message={error} onRetry={reload} />
      ) : items.length === 0 ? (
        <EmptyState icon="bell" title="Nothing yet" body="Booking updates and reminders will appear here." />
      ) : (
        <View style={{ gap: 12 }}>
          {items.map((n, i) => {
            const meta = TYPE[n.type] ?? TYPE.info;
            const color = t[meta.tone];
            return (
              <Reveal key={n.id} index={i}>
                <GlassCard padding={16} onPress={() => !n.is_read && markOne(n.id)} label={n.title}>
                  <View style={{ flexDirection: 'row', gap: 14 }}>
                    <View style={{ width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: `${color}1c` }}>
                      <Icon name={meta.icon} size={22} color={color} accent={color} />
                    </View>
                    <View style={{ flex: 1, gap: 3 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
                          {n.title}
                        </Text>
                        {!n.is_read ? <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: t.accent }} /> : null}
                      </View>
                      <Text variant="small" tone="ink2">
                        {n.message}
                      </Text>
                      <Text variant="small" tone="ink3" style={{ fontSize: 11.5 }}>
                        {relativeTime(n.created_at)}
                      </Text>
                    </View>
                  </View>
                </GlassCard>
              </Reveal>
            );
          })}
        </View>
      )}
    </Screen>
  );
}
