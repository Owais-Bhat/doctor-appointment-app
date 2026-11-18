import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { lockAvailable, setLockEnabled, useLockState } from '@/lib/lock';

import { GlassCard } from './ui/GlassCard';
import { GlassSwitch } from './ui/GlassSwitch';
import { Text } from './ui/Text';

/** App lock switch. Hidden on phones with no fingerprint, face or screen lock. */
export function SecurityCard() {
  const { enabled } = useLockState();
  const [available, setAvailable] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void lockAvailable().then((ok) => active && setAvailable(ok));
    return () => {
      active = false;
    };
  }, []);

  if (!available) return null;
  return (
    <GlassCard padding={16}>
      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">App lock</Text>
            <Text variant="small" tone="ink2">
              Ask for your fingerprint, face or screen lock when MedFlow opens.
            </Text>
          </View>
          <GlassSwitch
            value={enabled}
            label="App lock"
            onChange={(on) => {
              setMessage(null);
              void setLockEnabled(on).then((ok) => {
                if (!ok && on) setMessage('The lock was not turned on. Confirm with your fingerprint, face or screen lock.');
              });
            }}
          />
        </View>
        {message ? (
          <Text variant="small" tone="bad">
            {message}
          </Text>
        ) : null}
      </View>
    </GlassCard>
  );
}
