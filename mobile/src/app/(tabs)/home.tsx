import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { FlatList, View } from 'react-native';

import { DoctorCard } from '@/components/DoctorCard';
import { Header } from '@/components/Header';
import { AnimatedIcon, Icon } from '@/components/icons/Icon';
import type { IconName } from '@/components/icons/paths';
import { ErrorNote } from '@/components/States';
import { GlassCard } from '@/components/ui/GlassCard';
import { Reveal } from '@/components/ui/Reveal';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tap } from '@/components/ui/Tap';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/hooks/use-theme';
import { clinicNow } from '@/lib/clinic-time';
import { formatDate, formatTime, greeting, parseDate } from '@/lib/format';
import { paymentState } from '@/lib/payments';
import { doctorName, one, withDr, type Appointment, type AppNotification, type Doctor } from '@/lib/types';
import { useApi } from '@/lib/use-api';

const ACTIONS: { icon: IconName; label: string; hint: string; go: () => void }[] = [
  { icon: 'calendarPlus', label: 'Book a visit', hint: 'Pick a specialty', go: () => router.navigate('/book') },
  { icon: 'stethoscope', label: 'Find doctors', hint: 'Browse everyone', go: () => router.navigate('/doctors') },
  { icon: 'calendar', label: 'My visits', hint: 'Upcoming & past', go: () => router.navigate('/visits') },
  { icon: 'fileText', label: 'Health profile', hint: 'Your details', go: () => router.navigate('/profile') },
];

export default function Home() {
  const t = useTheme();
  const { profile } = useAuth();
  const appts = useApi<{ appointments: Appointment[]; paymentsEnabled?: boolean }>('/api/patient/appointments');
  const doctors = useApi<{ doctors: Doctor[] }>('/api/doctors', { auth: false });
  const notes = useApi<{ notifications: AppNotification[] }>('/api/patient/notifications');

  const now = clinicNow();
  const upcoming = (appts.data?.appointments ?? []).find(
    (a) => ['pending', 'confirmed'].includes(a.status) && `${a.appointment_date} ${a.appointment_time.slice(0, 5)}` >= now,
  );
  const due = upcoming ? paymentState(upcoming, !!appts.data?.paymentsEnabled)?.kind === 'due' : false;
  const unread = (notes.data?.notifications ?? []).filter((n) => !n.is_read).length;
  const first = profile?.full_name?.split(' ')[0] ?? '';

  const refresh = async () => {
    await Promise.all([appts.refresh(), doctors.refresh(), notes.refresh()]);
  };

  return (
    <Screen tabs onRefresh={refresh} refreshing={appts.refreshing || doctors.refreshing}>
      <Reveal index={0}>
        <Header
          title={first ? `${greeting()}, ${first}` : greeting()}
          subtitle="How can we help you today?"
          right={
            <Tap onPress={() => router.push('/notifications')} label="Notifications" style={{ width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: t.card, borderWidth: 1, borderColor: t.line }}>
              <AnimatedIcon name="bell" size={24} delay={300} />
              {unread > 0 ? <View style={{ position: 'absolute', top: 10, right: 11, width: 10, height: 10, borderRadius: 5, backgroundColor: t.bad, borderWidth: 2, borderColor: t.bg }} /> : null}
            </Tap>
          }
        />
      </Reveal>

      <Reveal index={1}>
        {appts.loading ? (
          <Skeleton height={150} radius={28} />
        ) : appts.error ? (
          <ErrorNote message={appts.error} onRetry={appts.reload} />
        ) : upcoming ? (
          <Tap onPress={() => router.navigate('/visits')} scaleTo={0.98} label="Next visit">
            <LinearGradient colors={[t.accent, t.accent2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 28, padding: 22, gap: 14 }}>
              <Text variant="caption" tone="onAccent" style={{ opacity: 0.8 }}>
                Next visit
              </Text>
              <Text variant="title" tone="onAccent">
                {formatDate(upcoming.appointment_date)} · {formatTime(upcoming.appointment_time)}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon name="stethoscope" size={20} color="#fff" accent="#fff" />
                <Text tone="onAccent" style={{ fontWeight: '600' }} numberOfLines={1}>
                  {withDr(one(upcoming.doctor_profiles?.profiles)?.full_name ?? 'Doctor')} · {upcoming.doctor_profiles?.specialty}
                </Text>
              </View>
              <Text variant="small" tone="onAccent" style={{ opacity: 0.85 }}>
                {upcoming.status === 'pending' ? 'Waiting for the doctor to confirm' : daysAway(upcoming.appointment_date)}
                {due ? ' · Payment due, tap to pay' : ''}
              </Text>
            </LinearGradient>
          </Tap>
        ) : (
          <GlassCard padding={22}>
            <View style={{ gap: 6 }}>
              <Text variant="h2">No visits coming up</Text>
              <Text tone="ink2">Book a doctor in a few taps — video, phone or in person.</Text>
            </View>
          </GlassCard>
        )}
      </Reveal>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {ACTIONS.map((a, i) => (
          <Reveal key={a.label} index={i + 2} style={{ width: '48%', flexGrow: 1 }}>
            <GlassCard onPress={a.go} padding={16} label={a.label}>
              <View style={{ gap: 12 }}>
                <AnimatedIcon name={a.icon} size={34} delay={400 + i * 150} strokeWidth={1.6} />
                <View>
                  <Text variant="bodyStrong">{a.label}</Text>
                  <Text variant="small" tone="ink2">
                    {a.hint}
                  </Text>
                </View>
              </View>
            </GlassCard>
          </Reveal>
        ))}
      </View>

      <Reveal index={6} style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Text variant="h2">Top-rated doctors</Text>
          <Tap onPress={() => router.navigate('/doctors')} buzz={false} hitSlop={8}>
            <Text variant="small" tone="accent" style={{ fontWeight: '700' }}>
              See all
            </Text>
          </Tap>
        </View>
        {doctors.loading ? (
          <Skeleton height={92} radius={24} />
        ) : (doctors.data?.doctors.length ?? 0) === 0 ? (
          <GlassCard padding={18}>
            <Text tone="ink2">Doctors will appear here as soon as the clinic verifies them.</Text>
          </GlassCard>
        ) : (
          <FlatList
            horizontal
            data={doctors.data?.doctors.slice(0, 6)}
            keyExtractor={(d) => d.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingRight: 8 }}
            renderItem={({ item }) => <DoctorCard doctor={item} compact />}
            accessibilityLabel={`${doctors.data?.doctors.map(doctorName).join(', ')}`}
          />
        )}
      </Reveal>
    </Screen>
  );
}

function daysAway(ymd: string): string {
  const d = Math.round((parseDate(ymd).getTime() - parseDate(clinicNow().slice(0, 10)).getTime()) / 86400000);
  return d <= 0 ? 'Today' : d === 1 ? 'Tomorrow' : `In ${d} days`;
}
