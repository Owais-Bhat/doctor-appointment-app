import { View } from 'react-native';

import { LANGUAGES, setLang, useLang, type Lang } from '@/lib/i18n';

import { GlassCard } from './ui/GlassCard';
import { Segmented } from './ui/Segmented';
import { Text } from './ui/Text';

/** English / हिन्दी / اردو. Applies at once and is remembered. */
export function LanguageCard() {
  const lang = useLang();
  return (
    <GlassCard padding={16}>
      <View style={{ gap: 12 }}>
        <Text variant="bodyStrong">Language</Text>
        <Segmented<Lang> options={LANGUAGES.map((l) => ({ value: l.value, label: l.label }))} value={lang} onChange={setLang} />
      </View>
    </GlassCard>
  );
}
