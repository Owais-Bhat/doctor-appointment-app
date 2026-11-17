import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

import { GoogleG } from './icons/GoogleG';
import { GlassSurface } from './ui/GlassSurface';
import { Tap } from './ui/Tap';
import { Text } from './ui/Text';

/** "Continue with Google": clear glass with the Google mark. `onPress` returns an error message, if any. */
export function GoogleButton({ onPress, label = 'Continue with Google' }: { onPress: () => Promise<void>; label?: string }) {
  const t = useTheme();
  const [busy, setBusy] = useState(false);
  return (
    <Tap
      label={label}
      disabled={busy}
      scaleTo={0.96}
      onPress={async () => {
        setBusy(true);
        try {
          await onPress();
        } finally {
          setBusy(false);
        }
      }}>
      <GlassSurface radius={28} variant="strong" shadow={false}>
        <View style={styles.row}>
          {busy ? <ActivityIndicator color={t.ink} /> : <GoogleG size={22} />}
          <Text variant="bodyStrong" style={{ fontSize: 16.5, letterSpacing: -0.2 }}>
            {label}
          </Text>
        </View>
      </GlassSurface>
    </Tap>
  );
}

const styles = StyleSheet.create({ row: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 11, paddingHorizontal: 22 } });
