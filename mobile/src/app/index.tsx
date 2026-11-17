import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text as RNText, View } from 'react-native';
import { Reveal } from '@/components/ui/Reveal';

import { LogoMark } from '@/components/LogoMark';
import { Backdrop } from '@/components/ui/Backdrop';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/context/auth';

const HOME = { patient: '/home', doctor: '/clinic/today', super_admin: '/admin/overview' } as const;

/** Animated splash while we find out who is signed in, then route by role. */
export default function Index() {
  const { status, profile, signOut } = useAuth();
  const [held, setHeld] = useState(true);
  const [stuck, setStuck] = useState(false);

  // Let the logo animation play even when the session resolves instantly
  useEffect(() => {
    const id = setTimeout(() => setHeld(false), 1500);
    // If we are still here after a while, say what the app is waiting for
    const stuckId = setTimeout(() => setStuck(true), 9000);
    return () => {
      clearTimeout(id);
      clearTimeout(stuckId);
    };
  }, []);

  if (!held && status !== 'loading') {
    if (status === 'signedOut') return <Redirect href="/login" />;
    return <Redirect href={HOME[profile?.role ?? 'patient'] ?? '/home'} />;
  }

  return (
    <Backdrop>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 22 }}>
        <LogoMark size={96} />
        <Reveal index={4} style={{ alignItems: 'center', gap: 4 }}>
          <Text variant="title">MedFlow</Text>
          <Text tone="ink2">Your doctor, one tap away</Text>
        </Reveal>
        {stuck ? (
          <View style={{ position: 'absolute', bottom: 48, left: 24, right: 24, alignItems: 'center', gap: 10 }}>
            <RNText style={{ color: '#8f98b8', fontSize: 12, textAlign: 'center' }}>
              Taking longer than usual… status: {status} · role: {profile?.role ?? 'none'}
            </RNText>
            <Pressable onPress={() => void signOut()} accessibilityRole="button" style={{ paddingVertical: 10, paddingHorizontal: 18, borderRadius: 14, backgroundColor: '#2a3250' }}>
              <RNText style={{ color: '#fff', fontWeight: '700' }}>Sign out and start over</RNText>
            </Pressable>
          </View>
        ) : null}
      </View>
    </Backdrop>
  );
}
