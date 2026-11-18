import { useState } from 'react';
import { View } from 'react-native';

import { Header } from '@/components/Header';
import { EmptyState, ErrorNote, ListSkeleton } from '@/components/States';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassChip } from '@/components/ui/GlassChip';
import { Reveal } from '@/components/ui/Reveal';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { ApiError, api } from '@/lib/api';
import type { FamilyMember } from '@/lib/types';
import { useApi } from '@/lib/use-api';

const RELATIONS = ['Mother', 'Father', 'Spouse', 'Son', 'Daughter', 'Brother', 'Sister', 'Other'];
const GENDERS = ['Male', 'Female', 'Other'];
const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

type Form = { full_name: string; relation: string; date_of_birth: string; gender: string; blood_type: string };
const EMPTY: Form = { full_name: '', relation: '', date_of_birth: '', gender: '', blood_type: '' };
const toForm = (m: FamilyMember): Form => ({ full_name: m.full_name, relation: m.relation ?? '', date_of_birth: m.date_of_birth ?? '', gender: m.gender ?? '', blood_type: m.blood_type ?? '' });

/** The people this account books visits for. */
export default function Family() {
  const { data, loading, error, refreshing, refresh, reload } = useApi<{ members: FamilyMember[] }>('/api/patient/family');
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));
  const dobBad = form.date_of_birth.trim() !== '' && !/^\d{4}-\d{2}-\d{2}$/.test(form.date_of_birth.trim());
  const start = (m?: FamilyMember) => {
    setEditing(m ? m.id : 'new');
    setForm(m ? toForm(m) : EMPTY);
    setMessage(null);
  };

  async function save() {
    setBusy(true);
    setMessage(null);
    const n = (v: string) => (v.trim() === '' ? null : v.trim());
    const body = { full_name: form.full_name.trim(), relation: n(form.relation), date_of_birth: n(form.date_of_birth), gender: n(form.gender), blood_type: n(form.blood_type) };
    try {
      await api(editing === 'new' ? '/api/patient/family' : `/api/patient/family/${editing}`, { method: editing === 'new' ? 'POST' : 'PATCH', body });
      setEditing(null);
      await refresh();
    } catch (e) {
      setMessage(e instanceof ApiError ? e.message : 'Could not save. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(m: FamilyMember) {
    setMessage(null);
    try {
      await api(`/api/patient/family/${m.id}`, { method: 'DELETE' });
      await refresh();
    } catch (e) {
      setMessage(e instanceof ApiError ? e.message : 'Could not remove this person.');
    }
  }

  const chips = (key: 'relation' | 'gender' | 'blood_type', options: string[]) => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map((o) => (
        <GlassChip key={o} label={o} height={38} selected={form[key] === o} onPress={() => set({ [key]: form[key] === o ? '' : o })} />
      ))}
    </View>
  );

  const members = data?.members ?? [];

  return (
    <Screen onRefresh={() => void refresh()} refreshing={refreshing}>
      <Reveal>
        <Header title="Family" back />
      </Reveal>
      <Reveal index={1}>
        <Text tone="ink2">Book visits for your parents, children or partner from your own account. The doctor sees who the visit is for.</Text>
      </Reveal>

      {editing !== null ? (
        <Reveal index={2}>
          <GlassCard padding={18}>
            <View style={{ gap: 14 }}>
              <Text variant="bodyStrong">{editing === 'new' ? 'Add a person' : 'Edit details'}</Text>
              <Field label="Full name" icon="user" value={form.full_name} onChangeText={(v) => set({ full_name: v })} maxLength={100} autoCapitalize="words" />
              <View style={{ gap: 8 }}>
                <Text variant="small" tone="ink2" style={{ marginLeft: 6, fontWeight: '700' }}>
                  Relation
                </Text>
                {chips('relation', RELATIONS)}
              </View>
              <Field label="Date of birth (optional)" icon="calendar" value={form.date_of_birth} onChangeText={(v) => set({ date_of_birth: v })} placeholder="1960-04-02" maxLength={10} keyboardType="numbers-and-punctuation" error={dobBad ? 'Write it like 1960-04-02' : null} />
              <View style={{ gap: 8 }}>
                <Text variant="small" tone="ink2" style={{ marginLeft: 6, fontWeight: '700' }}>
                  Gender
                </Text>
                {chips('gender', GENDERS)}
              </View>
              <View style={{ gap: 8 }}>
                <Text variant="small" tone="ink2" style={{ marginLeft: 6, fontWeight: '700' }}>
                  Blood type
                </Text>
                {chips('blood_type', BLOOD_TYPES)}
              </View>
              {message ? (
                <Text tone="bad" style={{ fontWeight: '600' }}>
                  {message}
                </Text>
              ) : null}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Button title="Save" icon="check" style={{ flex: 1 }} loading={busy} disabled={busy || !form.full_name.trim() || dobBad} onPress={() => void save()} />
                <Button title="Cancel" variant="ghost" style={{ flex: 1 }} disabled={busy} onPress={() => setEditing(null)} />
              </View>
            </View>
          </GlassCard>
        </Reveal>
      ) : (
        <Reveal index={2}>
          <Button title="Add a person" icon="userPlus" onPress={() => start()} />
        </Reveal>
      )}

      {editing === null && message ? (
        <Text tone="bad" style={{ fontWeight: '600' }}>
          {message}
        </Text>
      ) : null}

      {loading ? (
        <ListSkeleton rows={2} />
      ) : error ? (
        <ErrorNote message={error} onRetry={reload} />
      ) : members.length === 0 && editing === null ? (
        <EmptyState icon="users" title="No one added yet" body="Add a family member, then pick them when you book a visit." />
      ) : (
        <View style={{ gap: 12 }}>
          {members.map((m, i) => (
            <Reveal key={m.id} index={i}>
              <GlassCard padding={16}>
                <View style={{ gap: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                    <Avatar name={m.full_name} size={50} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text variant="bodyStrong" numberOfLines={1}>
                        {m.full_name}
                      </Text>
                      <Text variant="small" tone="ink2">
                        {[m.relation, m.date_of_birth, m.gender, m.blood_type ? `Blood ${m.blood_type}` : null].filter(Boolean).join(' · ') || 'No other details'}
                      </Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Button size="sm" variant="soft" icon="edit" title="Edit" onPress={() => start(m)} />
                    <Button size="sm" variant="danger" icon="trash" title="Remove" onPress={() => void remove(m)} />
                  </View>
                </View>
              </GlassCard>
            </Reveal>
          ))}
        </View>
      )}
    </Screen>
  );
}
