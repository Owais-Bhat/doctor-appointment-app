import { useEffect } from 'react';
import { View } from 'react-native';

import { useAuth } from '@/context/auth';
import { useTheme } from '@/hooks/use-theme';
import { unlock, useLockState } from '@/lib/lock';

import { LogoMark } from './LogoMark';
import { Backdrop } from './ui/Backdrop';
import { Button } from './ui/Button';
import { Text } from './ui/Text';

/** Covers the app until the owner proves it is them. Only when the lock is on and someone is signed in. */
export function LockScreen() {
  const { locked, enabled } = useLockState();
  const { status } = useAuth();
  const t = useTheme();
  const show = enabled && locked && status === 'ready';

  // Ask straight away; the button is for when the prompt was dismissed
  useEffect(() => {
    if (show) void unlock();
  }, [show]);

  if (!show) return null;
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9000, backgroundColor: t.bg }}>
      <Backdrop>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, padding: 32 }}>
          <LogoMark size={88} />
          <Text variant="title">MedFlow is locked</Text>
          <Text tone="ink2" style={{ textAlign: 'center' }}>
            Use your fingerprint, face or screen lock to continue.
          </Text>
          <Button title="Unlock" icon="lock" onPress={() => void unlock()} style={{ alignSelf: 'stretch' }} />
        </View>
      </Backdrop>
    </View>
  );
}
