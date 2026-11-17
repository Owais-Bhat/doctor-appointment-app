import { Redirect, Tabs } from 'expo-router';

import { GlassTabBar, type TabsConfig } from '@/components/TabBar';
import { Backdrop } from '@/components/ui/Backdrop';
import { useAuth } from '@/context/auth';

const TABS: TabsConfig = {
  today: { label: 'Today', icon: 'home' },
  appointments: { label: 'Visits', icon: 'calendar' },
  schedule: { label: 'Hours', icon: 'clock' },
  patients: { label: 'Patients', icon: 'users' },
  account: { label: 'Me', icon: 'user' },
};

/** The doctor's app: today, visits, weekly hours, patients and account. */
export default function ClinicLayout() {
  const { status, profile } = useAuth();
  if (status !== 'ready' || profile?.role !== 'doctor') return <Redirect href="/" />;

  return (
    <Backdrop>
      <Tabs tabBar={(props) => <GlassTabBar {...props} tabs={TABS} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'transparent' } }}>
        <Tabs.Screen name="today" />
        <Tabs.Screen name="appointments" />
        <Tabs.Screen name="schedule" />
        <Tabs.Screen name="patients" />
        <Tabs.Screen name="account" />
      </Tabs>
    </Backdrop>
  );
}
