import { signOut } from 'firebase/auth';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { getFirebaseAuth } from '@/lib/firebase';

type Props = { error: Error; retry: () => Promise<void> };

/**
 * Shown instead of a blank screen when a screen crashes while rendering.
 * Deliberately plain (no glass, no theme, no app context) so it can still draw
 * when the thing that broke is part of the app's own UI. Used as the
 * `ErrorBoundary` export of the root layout and each portal's layout.
 */
export function ErrorBoundary({ error, retry }: Props) {
  const lines = (error?.stack ?? '').split('\n').slice(0, 14).join('\n');

  async function reset() {
    try {
      const auth = getFirebaseAuth();
      if (auth) await signOut(auth);
    } catch {
      // nothing to sign out of
    }
    await retry();
  }

  const button = (bg: string) => ({ backgroundColor: bg, borderRadius: 14, paddingVertical: 14, alignItems: 'center' as const });

  return (
    <View style={{ flex: 1, backgroundColor: '#0b1020' }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 72, gap: 16 }}>
        <Text style={{ color: '#ffffff', fontSize: 24, fontWeight: '800' }}>Something went wrong</Text>
        <Text style={{ color: '#c7cde0', fontSize: 15, lineHeight: 22 }}>
          MedFlow hit an error while drawing this screen. Tap “Try again”. If it keeps happening, send a screenshot of this page so it can be fixed.
        </Text>
        <View style={{ backgroundColor: '#1a2036', borderRadius: 14, padding: 14, gap: 8 }}>
          <Text selectable style={{ color: '#ff8a9b', fontSize: 14, fontWeight: '700' }}>
            {String(error?.message ?? error)}
          </Text>
          {lines ? (
            <Text selectable style={{ color: '#8f98b8', fontSize: 11, lineHeight: 16 }}>
              {lines}
            </Text>
          ) : null}
        </View>
        <Pressable onPress={() => void retry()} style={button('#0a7aff')} accessibilityRole="button">
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>Try again</Text>
        </Pressable>
        <Pressable onPress={() => void reset()} style={button('#2a3250')} accessibilityRole="button">
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Sign out and start over</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
