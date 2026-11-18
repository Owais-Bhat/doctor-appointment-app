import { useState } from 'react';
import { View } from 'react-native';

import { Icon } from '@/components/icons/Icon';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassChip } from '@/components/ui/GlassChip';
import { Tap } from '@/components/ui/Tap';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/hooks/use-theme';
import { emptyItem, FREQUENCIES } from '@/lib/prescription';
import type { Prescription, PrescriptionItem } from '@/lib/types';

type Props = {
  /** What is saved on the server now. */
  saved: Prescription | null;
  savedFollowUp: string | null;
  saving: boolean;
  onSave: (rx: Prescription | null, followUp: string | null) => void;
};

type Draft = { items: PrescriptionItem[]; advice: string; followUp: string };

const FOLLOW_UP_OK = /^\d{4}-\d{2}-\d{2}$/;

/** The doctor writes medicines, advice and a follow-up date. Nothing is sent until Save. */
export function PrescriptionEditor({ saved, savedFollowUp, saving, onSave }: Props) {
  const t = useTheme();
  // null = untouched, so the form shows what is saved
  const [draft, setDraft] = useState<Draft | null>(null);
  const current: Draft = draft ?? { items: saved?.items.length ? saved.items : [emptyItem()], advice: saved?.advice ?? '', followUp: savedFollowUp ?? '' };

  const edit = (patch: Partial<Draft>) => setDraft({ ...current, ...patch });
  const setItem = (n: number, patch: Partial<PrescriptionItem>) => edit({ items: current.items.map((it, i) => (i === n ? { ...it, ...patch } : it)) });
  const removeItem = (n: number) => edit({ items: current.items.filter((_, i) => i !== n) });

  const followUpBad = current.followUp.trim() !== '' && !FOLLOW_UP_OK.test(current.followUp.trim());
  const filled = current.items.filter((i) => i.name.trim());

  function save() {
    const followUp = current.followUp.trim() || null;
    const rx = filled.length || current.advice.trim() ? { items: filled, advice: current.advice.trim() } : null;
    onSave(rx, followUp);
    setDraft(null);
  }

  return (
    <GlassCard padding={18}>
      <View style={{ gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Icon name="pill" size={22} color={t.accent} accent={t.accent} />
          <Text variant="bodyStrong" style={{ flex: 1 }}>
            Prescription
          </Text>
          {saved ? (
            <Text variant="small" tone="good" style={{ fontWeight: '700' }}>
              Sent to patient
            </Text>
          ) : null}
        </View>

        {current.items.map((it, n) => (
          <View key={n} style={{ gap: 10, paddingTop: n ? 14 : 0, borderTopWidth: n ? 1 : 0, borderTopColor: t.ink3 + '33' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text variant="small" tone="ink3" style={{ fontWeight: '700' }}>
                Medicine {n + 1}
              </Text>
              {current.items.length > 1 ? (
                <Tap onPress={() => removeItem(n)} label={`Remove medicine ${n + 1}`} hitSlop={10} scaleTo={0.85}>
                  <Icon name="trash" size={19} color={t.bad} accent={t.bad} />
                </Tap>
              ) : null}
            </View>
            <Field label="Name" value={it.name} onChangeText={(v) => setItem(n, { name: v })} placeholder="e.g. Paracetamol" maxLength={120} autoCapitalize="words" />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Field label="Dose" value={it.dose} onChangeText={(v) => setItem(n, { dose: v })} placeholder="500 mg" maxLength={60} />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="For how long" value={it.duration} onChangeText={(v) => setItem(n, { duration: v })} placeholder="5 days" maxLength={60} />
              </View>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {FREQUENCIES.map((f) => (
                <GlassChip key={f} label={f} height={36} selected={it.frequency === f} onPress={() => setItem(n, { frequency: it.frequency === f ? '' : f })} />
              ))}
            </View>
            <Field label="Note (optional)" value={it.note} onChangeText={(v) => setItem(n, { note: v })} placeholder="After food" maxLength={200} />
          </View>
        ))}

        <Button title="Add another medicine" icon="plus" variant="ghost" size="sm" onPress={() => edit({ items: [...current.items, emptyItem()] })} style={{ alignSelf: 'flex-start' }} />

        <Field label="Advice" icon="fileText" value={current.advice} onChangeText={(v) => edit({ advice: v })} multiline maxLength={4000} placeholder="Rest, fluids, what to watch for…" />
        <Field label="Follow-up date (optional)" icon="calendar" value={current.followUp} onChangeText={(v) => edit({ followUp: v })} placeholder="2026-12-31" maxLength={10} keyboardType="numbers-and-punctuation" error={followUpBad ? 'Write it like 2026-12-31' : null} />

        <Button title={saved ? 'Update prescription' : 'Save prescription'} icon="check" loading={saving} disabled={saving || draft === null || followUpBad} onPress={save} />
      </View>
    </GlassCard>
  );
}
