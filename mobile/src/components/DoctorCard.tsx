import { router } from 'expo-router';
import { View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { formatMoney } from '@/lib/format';
import { doctorName, one, withDr, type Doctor } from '@/lib/types';

import { Icon } from './icons/Icon';
import { specialtyIcon } from './icons/paths';
import { Avatar } from './ui/Avatar';
import { GlassCard } from './ui/GlassCard';
import { Text } from './ui/Text';

export function DoctorCard({ doctor, compact = false }: { doctor: Doctor; compact?: boolean }) {
  const t = useTheme();
  const name = doctorName(doctor);
  const avatar = one(doctor.profiles)?.avatar_url;

  return (
    <GlassCard
      label={`${name}, ${doctor.specialty}`}
      onPress={() => router.push({ pathname: '/doctor/[id]', params: { id: doctor.id } })}
      style={compact ? { width: 236 } : undefined}
      padding={16}>
      <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
        <Avatar name={name} uri={avatar} size={compact ? 50 : 58} />
        <View style={{ flex: 1, gap: 3 }}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {withDr(name)}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name={specialtyIcon(doctor.specialty)} size={15} color={t.ink2} />
            <Text variant="small" tone="ink2" numberOfLines={1} style={{ flexShrink: 1 }}>
              {doctor.specialty}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Icon name="star" size={14} color={t.warn} accent={t.warn} strokeWidth={1.6} />
              <Text variant="small" style={{ fontWeight: '700' }}>
                {doctor.total_reviews > 0 ? doctor.rating.toFixed(1) : 'New'}
              </Text>
            </View>
            <Text variant="small" tone="accent" style={{ fontWeight: '700' }}>
              {formatMoney(doctor.consultation_fee)}
            </Text>
          </View>
        </View>
        {!compact ? <Icon name="chevronRight" size={20} color={t.ink3} /> : null}
      </View>
    </GlassCard>
  );
}
