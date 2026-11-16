import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MaxContentWidth, TAB_BAR_SPACE } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Aurora } from './Aurora';

type Props = {
  children: ReactNode;
  /** Scrollable content (default) or a fixed layout. */
  scroll?: boolean;
  /** Leave room for the floating tab bar. */
  tabs?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
};

/** Aurora backdrop + safe areas + a readable max width on tablets and the web. */
export function Screen({ children, scroll = true, tabs = false, onRefresh, refreshing = false, contentStyle }: Props) {
  const insets = useSafeAreaInsets();
  const t = useTheme();
  const pad = { paddingTop: insets.top + 12, paddingBottom: (tabs ? TAB_BAR_SPACE : insets.bottom) + 16, paddingHorizontal: 20 };

  return (
    <View style={[styles.root, { backgroundColor: t.bg }]}>
      <Aurora />
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.content, pad, contentStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.accent} /> : undefined}>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, styles.fixed, pad, contentStyle]}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', gap: 16 },
  fixed: { flex: 1 },
});
