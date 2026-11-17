import { useState } from 'react';
import { View } from 'react-native';

import { Header } from '@/components/Header';
import { Icon } from '@/components/icons/Icon';
import { EmptyState, ErrorNote, ListSkeleton } from '@/components/States';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Reveal } from '@/components/ui/Reveal';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/use-theme';
import { api, ApiError } from '@/lib/api';
import { auditLabel, auditTone } from '@/lib/audit';
import { relativeTime } from '@/lib/format';
import { one, type AuditLog } from '@/lib/types';
import { useApi } from '@/lib/use-api';

type Page = { logs: AuditLog[]; total: number; page: number; limit: number };

export default function Activity() {
  const t = useTheme();
  // The first page comes from the usual loader; "Load more" appends further pages
  const first = useApi<Page>('/api/super-admin/audit-logs?page=1&limit=20');
  const [extra, setExtra] = useState<AuditLog[]>([]);
  const [nextPage, setNextPage] = useState(2);
  const [more, setMore] = useState(false);
  const [moreError, setMoreError] = useState<string | null>(null);

  const logs = [...(first.data?.logs ?? []), ...extra];
  const total = first.data?.total ?? 0;

  async function loadMore() {
    setMore(true);
    setMoreError(null);
    try {
      const res = await api<Page>(`/api/super-admin/audit-logs?page=${nextPage}&limit=20`);
      setExtra((old) => [...old, ...res.logs]);
      setNextPage(nextPage + 1);
    } catch (e) {
      setMoreError(e instanceof ApiError ? e.message : 'Could not load more.');
    } finally {
      setMore(false);
    }
  }

  async function refresh() {
    setExtra([]);
    setNextPage(2);
    await first.refresh();
  }

  const tone = { good: t.good, bad: t.bad, neutral: t.ink3 } as const;

  return (
    <Screen tabs onRefresh={refresh} refreshing={first.refreshing}>
      <Reveal>
        <Header title="Activity" subtitle={total ? `${total} events` : 'Who did what'} />
      </Reveal>

      {first.loading ? (
        <ListSkeleton rows={4} />
      ) : first.error ? (
        <ErrorNote message={first.error} onRetry={first.reload} />
      ) : logs.length === 0 ? (
        <EmptyState icon="list" title="Nothing yet" body="Admin and booking activity shows up here." />
      ) : (
        <View style={{ gap: 10 }}>
          {logs.map((l, i) => {
            const who = one(l.profiles);
            const color = tone[auditTone(l.action)];
            return (
              <Reveal key={l.id} index={Math.min(i, 6)}>
                <GlassCard padding={14}>
                  <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                    <View style={{ width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: `${color}22` }}>
                      <Icon name={auditTone(l.action) === 'bad' ? 'alert' : auditTone(l.action) === 'good' ? 'check' : 'info'} size={20} color={color} accent={color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text variant="small" numberOfLines={2}>
                        <Text variant="small" style={{ fontWeight: '800' }}>
                          {who?.full_name ?? 'Someone'}
                        </Text>{' '}
                        {auditLabel(l.action)}
                      </Text>
                      <Text variant="small" tone="ink3" style={{ fontSize: 11.5 }}>
                        {relativeTime(l.created_at)}
                        {who?.role ? ` · ${who.role.replace('_', ' ')}` : ''}
                      </Text>
                    </View>
                  </View>
                </GlassCard>
              </Reveal>
            );
          })}
          {moreError ? (
            <Text variant="small" tone="bad" style={{ fontWeight: '600' }}>
              {moreError}
            </Text>
          ) : null}
          {logs.length < total ? <Button title="Load more" variant="soft" size="sm" loading={more} onPress={loadMore} /> : null}
        </View>
      )}
    </Screen>
  );
}
