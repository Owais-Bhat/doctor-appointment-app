import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Header } from '@/components/Header';
import { Icon } from '@/components/icons/Icon';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { GlassCard } from '@/components/ui/GlassCard';
import { Reveal } from '@/components/ui/Reveal';
import { Screen } from '@/components/ui/Screen';
import { Tap } from '@/components/ui/Tap';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/use-theme';
import { ApiError, api } from '@/lib/api';
import { withDr } from '@/lib/types';
import { useApi } from '@/lib/use-api';

const WORDS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

/** After a completed visit: stars and an optional comment about the doctor. */
export default function RateVisit() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useApi<{ doctor?: { name: string } }>(`/api/visits/${id}`);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const doctor = withDr(data?.doctor?.name ?? 'your doctor');

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await api('/api/patient/reviews', { method: 'POST', body: { appointmentId: id, rating: stars, comment: comment.trim() || undefined } });
      router.back();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not send your review. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Reveal>
        <Header title="Rate your visit" back />
      </Reveal>
      <Reveal index={1}>
        <GlassCard padding={20}>
          <View style={{ gap: 16, alignItems: 'center' }}>
            <Text variant="h2" style={{ textAlign: 'center' }}>
              How was your visit with {doctor}?
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Tap key={n} onPress={() => setStars(n)} label={`${n} star${n > 1 ? 's' : ''}`} hitSlop={6} scaleTo={0.85}>
                  <Icon name="star" size={44} color={n <= stars ? t.warn : t.ink3} accent={n <= stars ? t.warn : t.ink3} />
                </Tap>
              ))}
            </View>
            <Text tone="ink2" style={{ fontWeight: '700', minHeight: 22 }}>
              {WORDS[stars]}
            </Text>
          </View>
        </GlassCard>
      </Reveal>
      <Reveal index={2}>
        <Field label="Comment (optional)" icon="fileText" value={comment} onChangeText={setComment} multiline maxLength={1000} placeholder="What went well? What could be better?" />
      </Reveal>
      {error ? (
        <Text tone="bad" style={{ fontWeight: '600' }}>
          {error}
        </Text>
      ) : null}
      <Button title="Send review" icon="check" loading={busy} disabled={busy || stars === 0} onPress={() => void submit()} />
    </Screen>
  );
}
