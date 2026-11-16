import { useRef } from 'react';
import { ActivityIndicator, Linking, Modal, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { useTheme } from '@/hooks/use-theme';
import { API_URL } from '@/lib/config';
import { appLinkFromIntent, checkoutHtml, checkoutOptions, FAILED, isCheckoutResult, LOAD_ERROR, type CheckoutOrder, type CheckoutProps } from '@/lib/payments';

import { Icon } from './icons/Icon';
import { Tap } from './ui/Tap';
import { Text } from './ui/Text';

/**
 * Razorpay Checkout in a full-screen sheet (iOS and Android). It runs in a
 * WebView, so it works in Expo Go and needs no native payment SDK. The web
 * build uses Checkout.web.tsx instead.
 */
export function Checkout({ order, appointmentId, onSuccess, onDismiss }: CheckoutProps) {
  if (!order) return null;
  // A fresh sheet per order, so nothing carries over from an earlier attempt
  return <Sheet key={order.orderId} order={order} appointmentId={appointmentId} onSuccess={onSuccess} onDismiss={onDismiss} />;
}

function Sheet({ order, appointmentId, onSuccess, onDismiss }: CheckoutProps & { order: CheckoutOrder }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const lastFailure = useRef<string | undefined>(undefined);

  function onMessage(e: WebViewMessageEvent) {
    let msg: { type?: string; result?: unknown; message?: string };
    try {
      msg = JSON.parse(e.nativeEvent.data);
    } catch {
      return;
    }
    if (msg.type === 'success' && isCheckoutResult(msg.result)) onSuccess(msg.result);
    // Razorpay keeps its window open after a failure so the patient can retry
    else if (msg.type === 'failed') lastFailure.current = msg.message || FAILED;
    else if (msg.type === 'dismiss') onDismiss(lastFailure.current);
    else if (msg.type === 'error') onDismiss(LOAD_ERROR);
  }

  /** Web pages load here; anything else is a banking or UPI app and opens outside. */
  function onNavigate(url: string): boolean {
    if (/^(https?|about|data|blob):/i.test(url)) return true;
    Linking.openURL(appLinkFromIntent(url) ?? url).catch(() => {
      // No app for this link on the phone: the patient can pick another method
    });
    return false;
  }

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={() => onDismiss(lastFailure.current)}>
      <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
        <View style={[styles.bar, { borderBottomColor: t.line }]}>
          <Icon name="lock" size={18} />
          <Text variant="bodyStrong" style={{ flex: 1 }}>
            Secure payment
          </Text>
          <Tap onPress={() => onDismiss(lastFailure.current)} label="Close payment" hitSlop={10} style={[styles.close, { backgroundColor: t.line }]}>
            <Icon name="close" size={18} />
          </Tap>
        </View>
        <WebView
          style={{ flex: 1, backgroundColor: t.bg }}
          originWhitelist={['*']}
          source={{ html: checkoutHtml(checkoutOptions(order, appointmentId, t.accent), t.bg, t.ink), baseUrl: API_URL }}
          onMessage={onMessage}
          onShouldStartLoadWithRequest={(req) => onNavigate(req.url)}
          onError={() => onDismiss(LOAD_ERROR)}
          javaScriptEnabled
          domStorageEnabled
          thirdPartyCookiesEnabled
          // Bank pages that ask for a new window open in this same view
          setSupportMultipleWindows={false}
          startInLoadingState
          renderLoading={() => (
            <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg }]}>
              <ActivityIndicator color={t.accent} />
            </View>
          )}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, height: 54, borderBottomWidth: StyleSheet.hairlineWidth },
  close: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
});
