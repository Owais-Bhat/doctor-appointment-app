import { Linking, View } from 'react-native';

import { AnimatedIcon } from '@/components/icons/Icon';
import { Button } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/context/auth';
import { API_URL } from '@/lib/config';

/** Doctors and admins use the web portal for now; this app is for patients. */
export default function WebOnly() {
  const { profile, signOut } = useAuth();
  const portal = profile?.role === 'super_admin' ? '/super-admin/dashboard' : '/admin/dashboard';
  return (
    <Screen scroll={false} contentStyle={{ justifyContent: 'center', alignItems: 'center', gap: 18 }}>
      <AnimatedIcon name="hospital" size={72} />
      <Reveal index={1} style={{ alignItems: 'center', gap: 8 }}>
        <Text variant="title" style={{ textAlign: 'center' }}>
          The {profile?.role === 'super_admin' ? 'admin' : 'doctor'} portal is on the web
        </Text>
        <Text tone="ink2" style={{ textAlign: 'center' }}>
          This app is for patients. Open the portal in your browser to manage your clinic.
        </Text>
      </Reveal>
      <Reveal index={2} style={{ width: '100%', gap: 10 }}>
        <Button title="Open web portal" icon="check" onPress={() => Linking.openURL(`${API_URL}${portal}`)} />
        <Button title="Sign out" variant="ghost" onPress={signOut} />
      </Reveal>
      <View />
    </Screen>
  );
}
