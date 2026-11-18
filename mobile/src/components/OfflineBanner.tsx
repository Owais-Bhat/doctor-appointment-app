import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useOffline } from '@/lib/offline';

import { Text } from './ui/Text';

/** A thin notice at the top while requests are failing for lack of a connection. */
export function OfflineBanner() {
  const offline = useOffline();
  const insets = useSafeAreaInsets();
  if (!offline) return null;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: insets.top + 4, left: 0, right: 0, alignItems: 'center', zIndex: 8000 }}>
      <View style={{ backgroundColor: '#1d2433ee', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 }}>
        <Text variant="small" style={{ color: '#fff', fontWeight: '700' }}>
          No connection — showing saved information
        </Text>
      </View>
    </View>
  );
}
