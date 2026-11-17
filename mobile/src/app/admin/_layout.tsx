import { Redirect, Tabs } from 'expo-router';

import { GlassTabBar, type TabsConfig } from '@/components/TabBar';
import { Backdrop } from '@/components/ui/Backdrop';
import { useAuth } from '@/context/auth';

const TABS: TabsConfig = {
  overview: { label: 'Overview', icon: 'chart' },
  doctors: { label: 'Doctors', icon: 'stethoscope' },
  users: { label: 'Users', icon: 'users' },
  activity: { label: 'Activity', icon: 'list' },
  account: { label: 'Me', icon: 'user' },
};

/** The platform admin's app: overview, doctors, users, activity log. */
export default function AdminLayout() {
  const { status, profile } = useAuth();
  if (status !== 'ready' || profile?.role !== 'super_admin') return <Redirect href="/" />;

  return (
    <Backdrop>
      <Tabs tabBar={(props) => <GlassTabBar {...props} tabs={TABS} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'transparent' } }}>
        <Tabs.Screen name="overview" />
        <Tabs.Screen name="doctors" />
        <Tabs.Screen name="users" />
        <Tabs.Screen name="activity" />
        <Tabs.Screen name="account" />
      </Tabs>
    </Backdrop>
  );
}
