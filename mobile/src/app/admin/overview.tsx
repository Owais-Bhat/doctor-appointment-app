import { View } from 'react-native';

import { BarChart } from '@/components/charts/BarChart';
import { Header } from '@/components/Header';
import { ErrorNote } from '@/components/States';
import { StatTile } from '@/components/StatTile';
import { GlassCard } from '@/components/ui/GlassCard';
import { Reveal } from '@/components/ui/Reveal';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/use-theme';
import { rupees } from '@/lib/clinic';
import type { AdminStats, AuditLog, MonthlyPoint } from '@/lib/types';
import { useApi } from '@/lib/use-api';
import { auditLabel } from '@/lib/audit';
import { one } from '@/lib/types';
import { relativeTime } from '@/lib/format';

type Analytics = { monthly: MonthlyPoint[]; userGrowth: MonthlyPoint[]; specialties: { name: string; count: number }[]; stats: { totalRevenue: number; totalAppointments: number } };

export default function Overview() {
  const t = useTheme();
  const stats = useApi<{ stats: AdminStats }>('/api/super-admin/stats');
  const analytics = useApi<Analytics>('/api/super-admin/analytics');
  const logs = useApi<{ logs: AuditLog[] }>('/api/super-admin/audit-logs?limit=4');
  const s = stats.data?.stats;
  const refresh = async () => {
    await Promise.all([stats.refresh(), analytics.refresh(), logs.refresh()]);
  };

  return (
    <Screen tabs onRefresh={refresh} refreshing={stats.refreshing || analytics.refreshing}>
      <Reveal>
        <Header title="Overview" subtitle="How MedFlow is doing" />
      </Reveal>

      {stats.error ? (
        <ErrorNote message={stats.error} onRetry={stats.reload} />
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          <Reveal index={1} style={{ width: '47.5%', flexGrow: 1 }}>
            <StatTile icon="users" value={s ? String(s.total_users) : '–'} label="Users" hint={s ? `+${s.new_users_this_month} this month` : undefined} tint={t.accent} />
          </Reveal>
          <Reveal index={2} style={{ width: '47.5%', flexGrow: 1 }}>
            <StatTile icon="stethoscope" value={s ? String(s.verified_doctors) : '–'} label="Doctors live" hint={s && s.pending_doctors > 0 ? `${s.pending_doctors} awaiting review` : undefined} />
          </Reveal>
          <Reveal index={3} style={{ width: '47.5%', flexGrow: 1 }}>
            <StatTile icon="calendar" value={s ? String(s.total_appointments) : '–'} label="Appointments" hint={s ? `${s.appointments_this_month} this month` : undefined} />
          </Reveal>
          <Reveal index={4} style={{ width: '47.5%', flexGrow: 1 }}>
            <StatTile icon="ban" value={s ? String(s.suspended_users) : '–'} label="Suspended" />
          </Reveal>
        </View>
      )}

      <Reveal index={5}>
        <GlassCard padding={18}>
          <View style={{ gap: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Text variant="bodyStrong">Appointments, last 6 months</Text>
              {analytics.data ? (
                <Text variant="small" tone="ink3">
                  about {rupees(analytics.data.stats.totalRevenue)}
                </Text>
              ) : null}
            </View>
            {analytics.loading ? <Skeleton height={150} radius={20} /> : analytics.error ? <Text tone="ink3">Could not load the chart.</Text> : <BarChart data={(analytics.data?.monthly ?? []).map((m) => ({ label: m.month, value: m.appointments ?? 0 }))} />}
          </View>
        </GlassCard>
      </Reveal>

      <Reveal index={6}>
        <GlassCard padding={18}>
          <View style={{ gap: 14 }}>
            <Text variant="bodyStrong">New users</Text>
            {analytics.loading ? <Skeleton height={150} radius={20} /> : analytics.error ? <Text tone="ink3">Could not load the chart.</Text> : <BarChart data={(analytics.data?.userGrowth ?? []).map((m) => ({ label: m.month, value: m.users ?? 0 }))} />}
          </View>
        </GlassCard>
      </Reveal>

      <Reveal index={7} style={{ gap: 12 }}>
        <Text variant="h2">Recently</Text>
        {(logs.data?.logs ?? []).map((l) => (
          <GlassCard key={l.id} padding={14}>
            <Text variant="small" numberOfLines={2}>
              <Text variant="small" style={{ fontWeight: '800' }}>
                {one(l.profiles)?.full_name ?? 'Someone'}
              </Text>{' '}
              {auditLabel(l.action)}
            </Text>
            <Text variant="small" tone="ink3" style={{ fontSize: 11.5 }}>
              {relativeTime(l.created_at)}
            </Text>
          </GlassCard>
        ))}
      </Reveal>
    </Screen>
  );
}
