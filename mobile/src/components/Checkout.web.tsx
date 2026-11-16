import { useEffect, useRef } from 'react';

import { Colors } from '@/constants/theme';
import { CHECKOUT_SRC, checkoutOptions, FAILED, isCheckoutResult, LOAD_ERROR, type CheckoutProps } from '@/lib/payments';

type RazorpayInstance = { open(): void; on(event: 'payment.failed', cb: (r: { error?: { description?: string } }) => void): void };
type RazorpayWindow = Window & { Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance };

let loading: Promise<boolean> | null = null;
function loadCheckout(): Promise<boolean> {
  const w = window as RazorpayWindow;
  if (w.Razorpay) return Promise.resolve(true);
  loading ??= new Promise<boolean>((resolve) => {
    const s = document.createElement('script');
    s.src = CHECKOUT_SRC;
    s.async = true;
    s.onload = () => resolve(!!w.Razorpay);
    s.onerror = () => {
      loading = null; // allow a retry after a network blip
      resolve(false);
    };
    document.head.appendChild(s);
  });
  return loading;
}

/** Web build: Razorpay Checkout opens as its usual overlay on the page. */
export function Checkout({ order, appointmentId, onSuccess, onDismiss }: CheckoutProps) {
  // Latest callbacks, so a re-render never reopens the payment window
  const handlers = useRef({ onSuccess, onDismiss });
  useEffect(() => {
    handlers.current = { onSuccess, onDismiss };
  });

  useEffect(() => {
    if (!order) return;
    let cancelled = false;
    let lastFailure: string | undefined;

    void loadCheckout().then((ready) => {
      if (cancelled) return;
      const Razorpay = (window as RazorpayWindow).Razorpay;
      if (!ready || !Razorpay) return handlers.current.onDismiss(LOAD_ERROR);

      const checkout = new Razorpay({
        ...checkoutOptions(order, appointmentId, Colors.light.accent),
        handler: (result: unknown) => {
          if (isCheckoutResult(result)) handlers.current.onSuccess(result);
        },
        modal: { ondismiss: () => handlers.current.onDismiss(lastFailure), confirm_close: true },
      });
      checkout.on('payment.failed', (r) => {
        lastFailure = r?.error?.description || FAILED;
      });
      checkout.open();
    });

    return () => {
      cancelled = true;
    };
  }, [order, appointmentId]);

  return null;
}
