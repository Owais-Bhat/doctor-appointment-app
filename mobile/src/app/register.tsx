import { Link, Redirect } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';

import { Icon } from '@/components/icons/Icon';
import { LogoMark } from '@/components/LogoMark';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { GlassCard } from '@/components/ui/GlassCard';
import { Reveal } from '@/components/ui/Reveal';
import { Screen } from '@/components/ui/Screen';
import { Tap } from '@/components/ui/Tap';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/use-theme';
import { authErrorMessage, useAuth } from '@/context/auth';

export default function Register() {
  const t = useTheme();
  const { status, register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === 'ready') return <Redirect href="/" />;

  async function submit() {
    setError(null);
    if (!name.trim()) return setError('Enter your full name.');
    if (!email.trim()) return setError('Enter your email.');
    if (password.length < 8) return setError('Use at least 8 characters for your password.');
    // The web app requires the same consent (age 18+, terms, privacy, health data)
    if (!agreed) return setError('Please accept the terms and privacy policy to continue.');
    setBusy(true);
    try {
      await register(name.trim(), email, password);
    } catch (e) {
      setError(authErrorMessage(e));
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen contentStyle={{ justifyContent: 'center', flexGrow: 1, gap: 20 }}>
        <View style={{ alignItems: 'center', gap: 12, marginTop: 8 }}>
          <LogoMark size={64} />
          <Reveal index={1} style={{ alignItems: 'center', gap: 4 }}>
            <Text variant="title">Create your account</Text>
            <Text tone="ink2">It takes under a minute</Text>
          </Reveal>
        </View>

        <Reveal index={2}>
          <GlassCard padding={20}>
            <View style={{ gap: 14 }}>
              <Field label="Full name" icon="user" value={name} onChangeText={setName} autoComplete="name" placeholder="Your name" />
              <Field label="Email" icon="mail" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" placeholder="you@example.com" />
              <Field label="Password" icon="lock" secure value={password} onChangeText={setPassword} autoComplete="new-password" placeholder="At least 8 characters" />

              <Tap onPress={() => setAgreed((a) => !a)} scaleTo={0.98} label="Accept terms">
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                  <View
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 9,
                      borderWidth: 1.5,
                      borderColor: agreed ? t.accent : t.line2,
                      backgroundColor: agreed ? t.accent : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    {agreed ? <Icon name="check" size={16} color="#fff" accent="#fff" strokeWidth={2.6} /> : null}
                  </View>
                  <Text variant="small" tone="ink2" style={{ flex: 1 }}>
                    I am 18 or older and agree to the terms of use and privacy policy, including use of my health information to provide care.
                  </Text>
                </View>
              </Tap>

              {error ? (
                <Text variant="small" tone="bad">
                  {error}
                </Text>
              ) : null}
              <Button title="Create account" loading={busy} onPress={submit} />
            </View>
          </GlassCard>
        </Reveal>

        <Reveal index={3} style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
          <Text tone="ink2">Already have an account?</Text>
          <Link href="/login" asChild>
            <Tap buzz={false} hitSlop={8}>
              <Text tone="accent" style={{ fontWeight: '700' }}>
                Sign in
              </Text>
            </Tap>
          </Link>
        </Reveal>
      </Screen>
    </KeyboardAvoidingView>
  );
}
