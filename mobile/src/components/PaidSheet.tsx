import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { useTheme } from '@/hooks/use-theme';

import { Button } from './ui/Button';
import { SuccessCheck } from './ui/SuccessCheck';
import { Text } from './ui/Text';

/** "Payment received" confirmation with the animated tick. */
export function PaidSheet({ visible, detail, onClose }: { visible: boolean; detail?: string; onClose: () => void }) {
  const t = useTheme();
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View entering={FadeIn.duration(180)} style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.45)' }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
      </Animated.View>
      <View style={styles.centre} pointerEvents="box-none">
        <Animated.View entering={ZoomIn.springify().damping(16)} style={[styles.card, { backgroundColor: t.cardSolid, borderColor: t.line }]}>
          <SuccessCheck size={108} />
          <Text variant="title" style={{ textAlign: 'center' }}>
            Payment received
          </Text>
          {detail ? (
            <Text tone="ink2" style={{ textAlign: 'center' }}>
              {detail}
            </Text>
          ) : null}
          <Button title="Done" onPress={onClose} style={{ alignSelf: 'stretch', marginTop: 6 }} />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  card: { width: '100%', maxWidth: 360, borderRadius: 28, borderWidth: StyleSheet.hairlineWidth, padding: 26, alignItems: 'center', gap: 12 },
});
