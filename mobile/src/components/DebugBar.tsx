import { usePathname } from 'expo-router';
import { Text, View } from 'react-native';

import { useAuth } from '@/context/auth';

/**
 * A thin plain-text strip across the top saying where the app is: current
 * route, sign-in status and role. Only drawn when EXPO_PUBLIC_DEBUG_BAR=1 at
 * build time, to find out why a screen is blank. Deliberately uses no glass,
 * theme or animation, so it still shows when those are what is broken.
 */
export function DebugBar() {
  const path = usePathname();
  const { status, profile } = useAuth();
  if (process.env.EXPO_PUBLIC_DEBUG_BAR !== '1') return null;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 9999, backgroundColor: '#d6336c', paddingTop: 34, paddingBottom: 6, paddingHorizontal: 10 }}>
      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>
        route {path} · status {status} · role {profile?.role ?? 'none'}
      </Text>
    </View>
  );
}
