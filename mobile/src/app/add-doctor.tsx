import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';

import { Header } from '@/components/Header';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassChip } from '@/components/ui/GlassChip';
import { Reveal } from '@/components/ui/Reveal';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { api, ApiError } from '@/lib/api';
import { SPECIALTIES } from '@/lib/config';

/** Admin: create a doctor's sign-in and profile in one go. */
export default function AddDoctor() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [specialty, setSpecialty] = useState<string>(SPECIALTIES[0]);
  const [fee, setFee] = useState('500');
  const [reg, setReg] = useState('');
  const [council, setCouncil] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    setError(null);
    if (!name.trim() || !email.trim()) return setError('Enter their name and email.');
    if (password.length < 8) return setError('Use at least 8 characters for the password.');
    setBusy(true);
    try {
      await api('/api/super-admin/doctors', {
        method: 'POST',
        body: { fullName: name.trim(), email: email.trim(), password, specialty, consultationFee: Number(fee) || 0, registrationNumber: reg.trim(), registrationCouncil: council.trim() },
      });
      setDone(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not add the doctor.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <Reveal>
          <Header title="Add a doctor" back />
        </Reveal>
        {done ? (
          <Reveal index={1}>
            <GlassCard padding={22}>
              <View style={{ gap: 12 }}>
                <Text variant="h2">Doctor added</Text>
                <Text tone="ink2">{name} can now sign in with {email} and the password you set. They are verified and can set their weekly hours.</Text>
                <Button title="Done" icon="check" onPress={() => router.back()} />
              </View>
            </GlassCard>
          </Reveal>
        ) : (
          <Reveal index={1}>
            <GlassCard padding={18}>
              <View style={{ gap: 14 }}>
                <Field label="Full name" icon="user" value={name} onChangeText={setName} placeholder="Dr. Sarah Johnson" />
                <Field label="Email" icon="mail" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="doctor@example.com" />
                <Field label="Password for their sign-in" icon="lock" secure value={password} onChangeText={setPassword} placeholder="At least 8 characters" />
                <View style={{ gap: 8 }}>
                  <Text variant="small" tone="ink2" style={{ marginLeft: 6, fontWeight: '700' }}>
                    Specialty
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {SPECIALTIES.map((s) => (
                      <GlassChip key={s} label={s} selected={specialty === s} height={40} onPress={() => setSpecialty(s)} />
                    ))}
                  </ScrollView>
                </View>
                <Field label="Consultation fee (₹)" icon="wallet" value={fee} onChangeText={setFee} keyboardType="numeric" />
                <Field label="Registration number" icon="shield" value={reg} onChangeText={setReg} autoCapitalize="characters" />
                <Field label="Medical council" icon="fileText" value={council} onChangeText={setCouncil} />
                {error ? (
                  <Text variant="small" tone="bad" style={{ fontWeight: '600' }}>
                    {error}
                  </Text>
                ) : null}
                <Button title="Add doctor" icon="userPlus" loading={busy} onPress={submit} />
              </View>
            </GlassCard>
          </Reveal>
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}
