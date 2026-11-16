import { Link, Redirect } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';

import { LogoMark } from '@/components/LogoMark';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { GlassCard } from '@/components/ui/GlassCard';
import { Reveal } from '@/components/ui/Reveal';
import { Screen } from '@/components/ui/Screen';
import { Tap } from '@/components/ui/Tap';
import { Text } from '@/components/ui/Text';
import { authErrorMessage, useAuth } from '@/context/auth';

export default function Login() {
  const { status, signIn, resetPassword, firebaseConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  if (status === 'ready') return <Redirect href="/" />;

  async function submit() {
    setError(null);
    setInfo(null);
    if (!email.trim() || !password) return setError('Enter your email and password.');
    setBusy(true);
    try {
      await signIn(email, password);
    } catch (e) {
      setError(authErrorMessage(e));
      setBusy(false);
    }
  }

  async function forgot() {
    setError(null);
    if (!email.trim()) return setError('Type your email first, then tap “Forgot password?”.');
    try {
      await resetPassword(email);
      setInfo('Password reset link sent. Check your inbox.');
    } catch (e) {
      setError(authErrorMessage(e));
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen contentStyle={{ justifyContent: 'center', flexGrow: 1, gap: 22 }}>
        <View style={{ alignItems: 'center', gap: 14, marginTop: 12 }}>
          <LogoMark size={76} />
          <Reveal index={1} style={{ alignItems: 'center', gap: 4 }}>
            <Text variant="title">Welcome back</Text>
            <Text tone="ink2">Sign in to book and manage your visits</Text>
          </Reveal>
        </View>

        <Reveal index={2}>
          <GlassCard style={{}} padding={20}>
            <View style={{ gap: 16 }}>
              {!firebaseConfigured ? (
                <Text variant="small" tone="warn">
                  Sign-in isn’t configured: add the EXPO_PUBLIC_FIREBASE_* values to mobile/.env.
                </Text>
              ) : null}
              <Field label="Email" icon="mail" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" placeholder="you@example.com" />
              <Field label="Password" icon="lock" secure value={password} onChangeText={setPassword} autoComplete="current-password" placeholder="Your password" onSubmitEditing={submit} />
              {error ? (
                <Text variant="small" tone="bad">
                  {error}
                </Text>
              ) : null}
              {info ? (
                <Text variant="small" tone="good">
                  {info}
                </Text>
              ) : null}
              <Button title="Sign in" icon="check" loading={busy} onPress={submit} />
              <View style={{ alignItems: 'center' }}>
                <Tap onPress={forgot} buzz={false} hitSlop={8}>
                  <Text variant="small" tone="accent" style={{ fontWeight: '700' }}>
                    Forgot password?
                  </Text>
                </Tap>
              </View>
            </View>
          </GlassCard>
        </Reveal>

        <Reveal index={3} style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
          <Text tone="ink2">New to MedFlow?</Text>
          <Link href="/register" asChild>
            <Tap buzz={false} hitSlop={8}>
              <Text tone="accent" style={{ fontWeight: '700' }}>
                Create an account
              </Text>
            </Tap>
          </Link>
        </Reveal>
      </Screen>
    </KeyboardAvoidingView>
  );
}
