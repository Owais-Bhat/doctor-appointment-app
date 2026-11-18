import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Header } from '@/components/Header';
import { ErrorNote, ListSkeleton } from '@/components/States';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassChip } from '@/components/ui/GlassChip';
import { Reveal } from '@/components/ui/Reveal';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { ApiError, api } from '@/lib/api';
import type { PatientProfile } from '@/lib/types';
import { useApi } from '@/lib/use-api';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = ['Male', 'Female', 'Other'];

type Form = Record<'phone' | 'blood_type' | 'date_of_birth' | 'gender' | 'address' | 'allergies' | 'chronic_conditions' | 'medications' | 'height' | 'weight' | 'emergency_contact_name' | 'emergency_contact_phone', string>;

const fromProfile = (p: PatientProfile): Form => ({
  phone: p.phone ?? '',
  blood_type: p.blood_type ?? '',
  date_of_birth: p.date_of_birth ?? '',
  gender: p.gender ?? '',
  address: p.address ?? '',
  allergies: p.health_stats?.allergies ?? '',
  chronic_conditions: p.health_stats?.chronic_conditions ?? '',
  medications: p.health_stats?.medications ?? '',
  height: p.health_stats?.height != null ? String(p.health_stats.height) : '',
  weight: p.health_stats?.weight != null ? String(p.health_stats.weight) : '',
  emergency_contact_name: p.health_stats?.emergency_contact_name ?? '',
  emergency_contact_phone: p.health_stats?.emergency_contact_phone ?? '',
});

/** The patient's own details and the health information doctors see before a visit. */
export default function EditProfile() {
  const { data, loading, error, reload } = useApi<{ profile: PatientProfile }>('/api/patient/profile');
  // null = untouched, so the form shows what is saved
  const [draft, setDraft] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const saved = data ? fromProfile(data.profile) : null;
  const f = draft ?? saved;
  const set = (k: keyof Form, v: string) => f && setDraft({ ...f, [k]: v });
  const dobBad = !!f && f.date_of_birth.trim() !== '' && !/^\d{4}-\d{2}-\d{2}$/.test(f.date_of_birth.trim());

  async function save() {
    if (!f) return;
    setSaving(true);
    setMessage(null);
    const n = (v: string) => (v.trim() === '' ? null : v.trim());
    try {
      await api('/api/patient/profile', {
        method: 'PATCH',
        body: {
          phone: n(f.phone),
          blood_type: n(f.blood_type),
          date_of_birth: n(f.date_of_birth),
          gender: n(f.gender),
          address: n(f.address),
          health_stats: {
            allergies: n(f.allergies),
            chronic_conditions: n(f.chronic_conditions),
            medications: n(f.medications),
            height: n(f.height),
            weight: n(f.weight),
            emergency_contact_name: n(f.emergency_contact_name),
            emergency_contact_phone: n(f.emergency_contact_phone),
          },
        },
      });
      router.back();
    } catch (e) {
      setMessage({ ok: false, text: e instanceof ApiError ? e.message : 'Could not save. Try again.' });
    } finally {
      setSaving(false);
    }
  }

  const chips = (key: 'blood_type' | 'gender', options: string[]) => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map((o) => (
        <GlassChip key={o} label={o} height={38} selected={f?.[key] === o} onPress={() => set(key, f?.[key] === o ? '' : o)} />
      ))}
    </View>
  );

  return (
    <Screen>
      <Reveal>
        <Header title="Health details" back />
      </Reveal>
      {loading ? (
        <ListSkeleton rows={3} />
      ) : error || !f ? (
        <ErrorNote message={error ?? 'Could not load your details.'} onRetry={reload} />
      ) : (
        <>
          <Reveal index={1}>
            <GlassCard padding={18}>
              <View style={{ gap: 14 }}>
                <Text variant="bodyStrong">About you</Text>
                <Field label="Phone" icon="phone" value={f.phone} onChangeText={(v) => set('phone', v)} keyboardType="phone-pad" maxLength={20} placeholder="+91 98765 43210" />
                <Field label="Date of birth" icon="calendar" value={f.date_of_birth} onChangeText={(v) => set('date_of_birth', v)} placeholder="1990-05-21" maxLength={10} keyboardType="numbers-and-punctuation" error={dobBad ? 'Write it like 1990-05-21' : null} />
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
                <Field label="Address" icon="pin" value={f.address} onChangeText={(v) => set('address', v)} maxLength={200} />
              </View>
            </GlassCard>
          </Reveal>

          <Reveal index={2}>
            <GlassCard padding={18}>
              <View style={{ gap: 14 }}>
                <Text variant="bodyStrong">Health</Text>
                <Text variant="small" tone="ink2">
                  Your doctor sees this before the visit.
                </Text>
                <Field label="Allergies" icon="alert" value={f.allergies} onChangeText={(v) => set('allergies', v)} maxLength={300} placeholder="Penicillin, peanuts…" />
                <Field label="Long-term conditions" icon="heart" value={f.chronic_conditions} onChangeText={(v) => set('chronic_conditions', v)} maxLength={300} placeholder="Diabetes, asthma…" />
                <Field label="Medicines you take" icon="pill" value={f.medications} onChangeText={(v) => set('medications', v)} maxLength={300} />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Field label="Height (cm)" value={f.height} onChangeText={(v) => set('height', v)} keyboardType="decimal-pad" maxLength={5} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field label="Weight (kg)" value={f.weight} onChangeText={(v) => set('weight', v)} keyboardType="decimal-pad" maxLength={5} />
                  </View>
                </View>
              </View>
            </GlassCard>
          </Reveal>

          <Reveal index={3}>
            <GlassCard padding={18}>
              <View style={{ gap: 14 }}>
                <Text variant="bodyStrong">Emergency contact</Text>
                <Field label="Name" icon="user" value={f.emergency_contact_name} onChangeText={(v) => set('emergency_contact_name', v)} maxLength={80} />
                <Field label="Phone" icon="phone" value={f.emergency_contact_phone} onChangeText={(v) => set('emergency_contact_phone', v)} keyboardType="phone-pad" maxLength={20} />
              </View>
            </GlassCard>
          </Reveal>

          {message ? (
            <Text tone={message.ok ? 'good' : 'bad'} style={{ fontWeight: '600' }}>
              {message.text}
            </Text>
          ) : null}
          <Button title="Save" icon="check" loading={saving} disabled={saving || draft === null || dobBad} onPress={() => void save()} />
        </>
      )}
    </Screen>
  );
}
