import { useState } from 'react';
import { View } from 'react-native';

import { Header } from '@/components/Header';
import { EmptyState, ErrorNote, ListSkeleton } from '@/components/States';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Reveal } from '@/components/ui/Reveal';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { ApiError, api } from '@/lib/api';
import { formatDate, formatMoney } from '@/lib/format';
import { useApi } from '@/lib/use-api';

type Refund = { id: string; date: string; time: string; patient: string | null; doctor: string | null; amount: number | null; status: 'refund_pending' | 'refunded'; refund_id: string | null; stuck: boolean };

/** Platform admin: refunds that went out, and the ones that did not. */
export default function Refunds() {
  const { data, loading, error, refreshing, refresh, reload } = useApi<{ refunds: Refund[]; stuck: number }>('/api/super-admin/refunds');
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function retry(r: Refund) {
    setBusy(r.id);
    setNotice(null);
    try {
      const res = await api<{ message: string }>(`/api/super-admin/refunds/${r.id}`, { method: 'POST' });
      setNotice(res.message);
      await refresh();
    } catch (e) {
      setNotice(e instanceof ApiError ? e.message : 'Could not retry this refund.');
    } finally {
      setBusy(null);
    }
  }

  const list = data?.refunds ?? [];
  return (
    <Screen onRefresh={() => void refresh()} refreshing={refreshing}>
      <Reveal>
        <Header title="Refunds" subtitle={loading ? undefined : (data?.stuck ?? 0) > 0 ? `${data?.stuck} did not go through` : 'Every refund has been sent'} back />
      </Reveal>
      {notice ? <Text tone="ink2" style={{ fontWeight: '600' }}>{notice}</Text> : null}
      {loading ? (
        <ListSkeleton rows={3} />
      ) : error ? (
        <ErrorNote message={error} onRetry={reload} />
      ) : list.length === 0 ? (
        <EmptyState icon="wallet" title="No refunds yet" body="When a paid visit is cancelled, its refund shows up here." />
      ) : (
        <View style={{ gap: 12 }}>
          {list.map((r, i) => (
            <Reveal key={r.id} index={i}>
              <GlassCard padding={16}>
                <View style={{ gap: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text variant="bodyStrong" numberOfLines={1}>
                        {r.patient ?? 'Patient'}
                      </Text>
                      <Text variant="small" tone="ink2" numberOfLines={1}>
                        with {r.doctor ?? 'doctor'} · {formatDate(r.date)}
                      </Text>
                      <Text variant="small" tone="ink3">
                        {r.amount !== null ? formatMoney(r.amount) : 'Amount unknown'}
                        {r.refund_id ? ` · ${r.refund_id}` : ''}
                      </Text>
                    </View>
                    <Badge label={r.stuck ? 'Not sent' : r.status === 'refunded' ? 'Refunded' : 'In progress'} tone={r.stuck ? 'bad' : r.status === 'refunded' ? 'good' : 'warn'} />
                  </View>
                  {r.stuck ? <Button size="sm" icon="check" title="Try again" loading={busy === r.id} disabled={!!busy} onPress={() => void retry(r)} style={{ alignSelf: 'flex-end' }} /> : null}
                </View>
              </GlassCard>
            </Reveal>
          ))}
        </View>
      )}
    </Screen>
  );
}
