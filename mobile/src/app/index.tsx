import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Reveal } from '@/components/ui/Reveal';

import { LogoMark } from '@/components/LogoMark';
import { Backdrop } from '@/components/ui/Backdrop';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/context/auth';

/** Animated splash while we find out who is signed in, then route by role. */
export default function Index() {
  const { status, profile } = useAuth();
  const [held, setHeld] = useState(true);

  // Let the logo animation play even when the session resolves instantly
  useEffect(() => {
    const id = setTimeout(() => setHeld(false), 1500);
    return () => clearTimeout(id);
  }, []);

  if (!held && status !== 'loading') {
    if (status === 'signedOut') return <Redirect href="/login" />;
    return <Redirect href={profile?.role === 'patient' ? '/home' : '/web-only'} />;
  }

  return (
    <Backdrop>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 22 }}>
        <LogoMark size={96} />
        <Reveal index={4} style={{ alignItems: 'center', gap: 4 }}>
          <Text variant="title">MedFlow</Text>
          <Text tone="ink2">Your doctor, one tap away</Text>
        </Reveal>
      </View>
    </Backdrop>
  );
}
