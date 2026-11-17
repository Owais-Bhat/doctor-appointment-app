import { Redirect, Tabs } from 'expo-router';

import { GlassTabBar, type TabsConfig } from '@/components/TabBar';
import { Backdrop } from '@/components/ui/Backdrop';
import { useAuth } from '@/context/auth';

const TABS: TabsConfig = {
  home: { label: 'Home', icon: 'home' },
  visits: { label: 'Visits', icon: 'calendar' },
  book: { label: 'Book', icon: 'plus', primary: true },
  doctors: { label: 'Doctors', icon: 'stethoscope' },
  profile: { label: 'Me', icon: 'user' },
};

export default function TabsLayout() {
  const { status } = useAuth();
  // Signed out (or session still loading): the splash screen decides where to go
  if (status !== 'ready') return <Redirect href="/" />;

  return (
    <Backdrop>
      <Tabs tabBar={(props) => <GlassTabBar {...props} tabs={TABS} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'transparent' } }}>
        <Tabs.Screen name="home" />
        <Tabs.Screen name="visits" />
        <Tabs.Screen name="book" />
        <Tabs.Screen name="doctors" />
        <Tabs.Screen name="profile" />
      </Tabs>
    </Backdrop>
  );
}
