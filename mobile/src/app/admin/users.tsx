import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Header } from '@/components/Header';
import { EmptyState, ErrorNote, ListSkeleton } from '@/components/States';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassChip } from '@/components/ui/GlassChip';
import { Reveal } from '@/components/ui/Reveal';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { api, ApiError } from '@/lib/api';
import { SPECIALTIES } from '@/lib/config';
import { formatDateLong } from '@/lib/format';
import type { AdminUser, Role } from '@/lib/types';
import { useApi } from '@/lib/use-api';

const ROLES: { value: 'all' | Role; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'patient', label: 'Patients' },
  { value: 'doctor', label: 'Doctors' },
  { value: 'super_admin', label: 'Admins' },
];
const ROLE_LABEL: Record<Role, string> = { patient: 'Patient', doctor: 'Doctor', super_admin: 'Admin' };

function UserCard({ user: u, me, onChanged }: { user: AdminUser; me: string | undefined; onChanged: () => Promise<void> }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [promoting, setPromoting] = useState(false);
  const [specialty, setSpecialty] = useState<string>(SPECIALTIES[0]);
  const [fee, setFee] = useState('500');
  const isMe = u.id === me;

  async function run(key: string, fn: () => Promise<unknown>) {
    setBusy(key);
    setError(null);
    try {
      await fn();
      setPromoting(false);
      await onChanged();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <GlassCard padding={16}>
      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
          <Avatar name={u.full_name} size={48} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="bodyStrong" numberOfLines={1}>
              {u.full_name}
              {isMe ? <Text variant="small" tone="ink3">{'  (you)'}</Text> : null}
            </Text>
            <Text variant="small" tone="ink2" numberOfLines={1}>
              {u.email || 'No email'}
            </Text>
            <Text variant="small" tone="ink3" style={{ fontSize: 11.5 }}>
              Joined {formatDateLong(u.created_at.slice(0, 10))}
            </Text>
          </View>
          <View style={{ gap: 6, alignItems: 'flex-end' }}>
            <Badge label={ROLE_LABEL[u.role]} tone={u.role === 'super_admin' ? 'accent' : u.role === 'doctor' ? 'good' : 'neutral'} />
            {!u.is_active ? <Badge label="Suspended" tone="bad" /> : null}
          </View>
        </View>

        {error ? (
          <Text variant="small" tone="bad" style={{ fontWeight: '600' }}>
            {error}
          </Text>
        ) : null}

        {u.role !== 'super_admin' && !isMe ? (
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {u.role === 'patient' && u.is_active ? <Button size="sm" variant="soft" icon="stethoscope" title="Make doctor" disabled={!!busy} onPress={() => setPromoting((p) => !p)} /> : null}
            {u.role === 'doctor' ? <Button size="sm" variant="ghost" title="Back to patient" loading={busy === 'demote'} disabled={!!busy} onPress={() => run('demote', () => api('/api/super-admin/settings/promote', { method: 'DELETE', body: { userId: u.id } }))} /> : null}
            <Button
              size="sm"
              variant={u.is_active ? 'danger' : 'primary'}
              icon={u.is_active ? 'ban' : 'check'}
              title={u.is_active ? 'Suspend' : 'Reactivate'}
              loading={busy === 'active'}
              disabled={!!busy}
              onPress={() => run('active', () => api('/api/super-admin/users', { method: 'PATCH', body: { userId: u.id, is_active: !u.is_active } }))}
            />
          </View>
        ) : null}

        {promoting ? (
          <View style={{ gap: 12 }}>
            <Text variant="small" tone="ink2" style={{ fontWeight: '700' }}>
              Specialty
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {SPECIALTIES.map((s) => (
                <GlassChip key={s} label={s} selected={specialty === s} height={40} onPress={() => setSpecialty(s)} />
              ))}
            </ScrollView>
            <Field label="Consultation fee (₹)" icon="wallet" value={fee} onChangeText={setFee} keyboardType="numeric" />
            <Button title="Make doctor" icon="check" loading={busy === 'promote'} disabled={!!busy} onPress={() => run('promote', () => api('/api/super-admin/settings/promote', { method: 'POST', body: { userId: u.id, specialty, consultationFee: Number(fee) || 0 } }))} />
          </View>
        ) : null}
      </View>
    </GlassCard>
  );
}

export default function Users() {
  const { data, loading, error, refreshing, refresh, reload } = useApi<{ users: AdminUser[]; me: string }>('/api/super-admin/users');
  const [query, setQuery] = useState('');
  const [role, setRole] = useState<'all' | Role>('all');

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.users ?? []).filter((u) => (role === 'all' || u.role === role) && (!q || `${u.full_name} ${u.email}`.toLowerCase().includes(q)));
  }, [data, query, role]);

  return (
    <Screen tabs onRefresh={refresh} refreshing={refreshing}>
      <Reveal>
        <Header title="Users" subtitle={data ? `${data.users.length} accounts` : 'Everyone on MedFlow'} />
      </Reveal>
      <Reveal index={1}>
        <Field label="Search" icon="search" value={query} onChangeText={setQuery} placeholder="Name or email" returnKeyType="search" autoCapitalize="none" />
      </Reveal>
      <Reveal index={2}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 8 }}>
          {ROLES.map((r) => (
            <GlassChip key={r.value} label={r.label} selected={role === r.value} height={42} onPress={() => setRole(r.value)} />
          ))}
        </ScrollView>
      </Reveal>

      {loading ? (
        <ListSkeleton rows={4} />
      ) : error ? (
        <ErrorNote message={error} onRetry={reload} />
      ) : list.length === 0 ? (
        <EmptyState icon="search" title="No match" body="Try another name or filter." />
      ) : (
        <View style={{ gap: 12 }}>
          {list.map((u, i) => (
            <Reveal key={u.id} index={Math.min(i, 6)}>
              <UserCard user={u} me={data?.me} onChanged={refresh} />
            </Reveal>
          ))}
        </View>
      )}
    </Screen>
  );
}
