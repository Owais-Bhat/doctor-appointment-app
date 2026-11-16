import { Redirect, Tabs } from 'expo-router';

import { TabBar } from '@/components/TabBar';
import { useAuth } from '@/context/auth';

export default function TabsLayout() {
  const { status } = useAuth();
  // Signed out (or session still loading): the splash screen decides where to go
  if (status !== 'ready') return <Redirect href="/" />;

  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'transparent' } }}>
      <Tabs.Screen name="home" />
      <Tabs.Screen name="visits" />
      <Tabs.Screen name="book" />
      <Tabs.Screen name="doctors" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
