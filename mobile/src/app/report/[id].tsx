import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, View } from 'react-native';

import { Header } from '@/components/Header';
import { Reveal } from '@/components/ui/Reveal';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { authHeaders } from '@/lib/api';
import { fileUrl } from '@/lib/files';

/** A report photo, loaded with the sign-in header the server needs. */
export default function ReportViewer() {
  const { id, title, path } = useLocalSearchParams<{ id: string; title?: string; path?: string }>();
  const [headers, setHeaders] = useState<Record<string, string> | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    authHeaders()
      .then((h) => active && setHeaders(h))
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, []);

  return (
    <Screen>
      <Reveal>
        <Header title={title || 'Report'} back />
      </Reveal>
      {failed ? (
        <Text tone="bad">Could not open this report. Go back and try again.</Text>
      ) : !headers ? (
        <View style={{ alignItems: 'center', padding: 40 }}>
          <ActivityIndicator />
        </View>
      ) : (
        <Image
          source={{ uri: fileUrl(id, path), headers }}
          style={{ width: '100%', aspectRatio: 0.75, borderRadius: 20 }}
          resizeMode="contain"
          onError={() => setFailed(true)}
          accessibilityLabel={title || 'Report'}
        />
      )}
    </Screen>
  );
}
