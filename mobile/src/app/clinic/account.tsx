import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { AppearanceCard } from '@/components/AppearanceCard';
import { BarChart } from '@/components/charts/BarChart';
import { Header } from '@/components/Header';
import { ErrorNote } from '@/components/States';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassChip } from '@/components/ui/GlassChip';
import { Reveal } from '@/components/ui/Reveal';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/context/auth';
import { api, ApiError } from '@/lib/api';
import { rupees } from '@/lib/clinic';
import { SPECIALTIES } from '@/lib/config';
import { one, type DoctorOwnProfile, type MonthlyPoint } from '@/lib/types';
import { useApi } from '@/lib/use-api';

type Form = { full_name: string; specialty: string; fee: string; years: string; clinic: string; address: string; reg: string; council: string; bio: string; languages: string; qualifications: string };

const toForm = (p: DoctorOwnProfile): Form => ({
  full_name: one(p.profiles)?.full_name ?? '',
  specialty: p.specialty,
  fee: p.consultation_fee != null ? String(p.consultation_fee) : '',
  years: p.experience_years != null ? String(p.experience_years) : '',
  clinic: p.clinic_name ?? '',
  address: p.clinic_address ?? '',
  reg: p.registration_number ?? '',
  council: p.registration_council ?? '',
  bio: p.bio ?? '',
  languages: (p.languages ?? []).join(', '),
  qualifications: (p.qualifications ?? []).join(', '),
});
const list = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);

export default function Account() {
  const { signOut } = useAuth();
  const prof = useApi<{ profile: DoctorOwnProfile }>('/api/doctor/profile');
  const stats = useApi<{ monthly: MonthlyPoint[]; stats: { totalVisits: number; totalRevenue: number; uniquePatients: number; completedVisits: number } }>('/api/doctor/analytics');
  // null = not editing; otherwise the draft being edited
  const [draft, setDraft] = useState<Form | null>(null);
  const editing = draft !== null;
  const form = draft;
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const p = prof.data?.profile;

  const set = (k: keyof Form) => (v: string) => setDraft((f) => (f ? { ...f, [k]: v } : f));

  async function save() {
    if (!form) return;
    setSaving(true);
    setMessage(null);
    try {
      await api('/api/doctor/profile', {
        method: 'PATCH',
        body: {
          full_name: form.full_name,
          specialty: form.specialty,
          consultation_fee: form.fee === '' ? undefined : Number(form.fee),
          experience_years: form.years === '' ? undefined : Number(form.years),
          clinic_name: form.clinic,
          clinic_address: form.address,
          registration_number: form.reg,
          registration_council: form.council,
          bio: form.bio,
          languages: list(form.languages),
          qualifications: list(form.qualifications),
        },
      });
      setMessage({ ok: true, text: 'Profile saved.' });
      setDraft(null);
      await prof.refresh();
    } catch (e) {
      setMessage({ ok: false, text: e instanceof ApiError ? e.message : 'Could not save your profile.' });
    } finally {
      setSaving(false);
    }
  }

  const name = one(p?.profiles)?.full_name ?? 'Doctor';
  const monthly = (stats.data?.monthly ?? []).map((m) => ({ label: m.month, value: m.visits ?? 0 }));

  return (
    <Screen tabs onRefresh={async () => { await Promise.all([prof.refresh(), stats.refresh()]); }} refreshing={prof.refreshing}>
      <Reveal>
        <Header title="Me" subtitle="Your profile and numbers" />
      </Reveal>

      {prof.error ? (
        <ErrorNote message={prof.error} onRetry={prof.reload} />
      ) : (
        <Reveal index={1}>
          <GlassCard padding={20}>
            {p ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <Avatar name={name} size={64} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text variant="h2" numberOfLines={1}>
                    {name.startsWith('Dr') ? name : `Dr. ${name}`}
                  </Text>
                  <Text tone="ink2" numberOfLines={1}>
                    {p.specialty}
                    {p.clinic_name ? ` · ${p.clinic_name}` : ''}
                  </Text>
                  <Badge label={p.is_verified ? 'Verified · visible to patients' : 'Under review · hidden from search'} tone={p.is_verified ? 'good' : 'warn'} />
                </View>
              </View>
            ) : (
              <Skeleton height={64} radius={20} />
            )}
          </GlassCard>
        </Reveal>
      )}

      <Reveal index={2}>
        <GlassCard padding={18}>
          <View style={{ gap: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Text variant="bodyStrong">Visits, last 6 months</Text>
              {stats.data ? (
                <Text variant="small" tone="ink3">
                  {stats.data.stats.uniquePatients} patients
                </Text>
              ) : null}
            </View>
            {stats.loading ? <Skeleton height={150} radius={20} /> : stats.error ? <Text tone="ink3">Could not load your numbers.</Text> : <BarChart data={monthly} />}
            {stats.data ? (
              <Text variant="small" tone="ink2">
                {stats.data.stats.completedVisits} completed · about {rupees(stats.data.stats.totalRevenue)} in fees
              </Text>
            ) : null}
          </View>
        </GlassCard>
      </Reveal>

      <Reveal index={3} style={{ gap: 12 }}>
        {message ? (
          <Text tone={message.ok ? 'good' : 'bad'} style={{ fontWeight: '600' }}>
            {message.text}
          </Text>
        ) : null}
        {!editing ? (
          <Button title="Edit profile" icon="edit" variant="soft" onPress={() => p && setDraft(toForm(p))} disabled={!p} />
        ) : form ? (
          <GlassCard padding={18}>
            <View style={{ gap: 14 }}>
              <Field label="Full name" icon="user" value={form.full_name} onChangeText={set('full_name')} />
              <View style={{ gap: 8 }}>
                <Text variant="small" tone="ink2" style={{ marginLeft: 6, fontWeight: '700' }}>
                  Specialty
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {SPECIALTIES.map((s) => (
                    <GlassChip key={s} label={s} selected={form.specialty === s} height={40} onPress={() => set('specialty')(s)} />
                  ))}
                </ScrollView>
              </View>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Field label="Fee (₹)" icon="wallet" value={form.fee} onChangeText={set('fee')} keyboardType="numeric" />
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="Years" icon="clock" value={form.years} onChangeText={set('years')} keyboardType="numeric" />
                </View>
              </View>
              <Field label="Clinic name" icon="hospital" value={form.clinic} onChangeText={set('clinic')} />
              <Field label="Clinic address" icon="pin" value={form.address} onChangeText={set('address')} />
              <Field label="Registration number" icon="shield" value={form.reg} onChangeText={set('reg')} autoCapitalize="characters" />
              <Field label="Medical council" icon="fileText" value={form.council} onChangeText={set('council')} />
              <Field label="Qualifications (comma separated)" icon="star" value={form.qualifications} onChangeText={set('qualifications')} />
              <Field label="Languages (comma separated)" icon="smile" value={form.languages} onChangeText={set('languages')} />
              <Field label="About you" icon="fileText" value={form.bio} onChangeText={set('bio')} multiline maxLength={2000} />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Button title="Cancel" variant="ghost" style={{ flex: 1 }} onPress={() => { setDraft(null); setMessage(null); }} />
                <Button title="Save" icon="check" style={{ flex: 1 }} loading={saving} onPress={save} />
              </View>
            </View>
          </GlassCard>
        ) : null}
      </Reveal>

      <Reveal index={4}>
        <AppearanceCard />
      </Reveal>
      <Reveal index={5} style={{ gap: 10 }}>
        <Button title="Verification documents" icon="shield" variant="soft" onPress={() => router.push('/my-documents')} />
        <Button title="Notifications" icon="bell" variant="soft" onPress={() => router.push('/notifications')} />
        <Button title="Sign out" icon="logout" variant="danger" onPress={signOut} />
      </Reveal>
    </Screen>
  );
}
