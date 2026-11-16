import { useCallback, useState } from 'react';

import { api, ApiError } from './api';
import type { CheckoutOrder, CheckoutProps, CheckoutResult } from './payments';

/**
 * Pay for a confirmed visit: the server creates (or reuses) the order,
 * Razorpay Checkout collects the money, then the server verifies the signed
 * result. Render `<Checkout {...checkout} />` once on the screen.
 */
export function usePayVisit(onPaid: (appointmentId: string) => void) {
  const [open, setOpen] = useState<{ order: CheckoutOrder; appointmentId: string } | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [error, setError] = useState<{ id: string; message: string } | null>(null);

  const pay = useCallback(async (appointmentId: string) => {
    setPayingId(appointmentId);
    setError(null);
    try {
      const order = await api<CheckoutOrder>('/api/payments/order', { method: 'POST', body: { appointmentId } });
      setOpen({ order, appointmentId });
    } catch (e) {
      setError({ id: appointmentId, message: e instanceof ApiError ? e.message : 'Payment couldn’t be started.' });
      setPayingId(null);
    }
  }, []);

  const onSuccess = useCallback(
    async (result: CheckoutResult) => {
      const id = open?.appointmentId;
      if (!id) return;
      setOpen(null);
      try {
        await api('/api/payments/verify', { method: 'POST', body: result });
        onPaid(id);
      } catch (e) {
        setError({
          id,
          message:
            e instanceof ApiError && e.status === 409
              ? e.message // "still being confirmed": the webhook finishes it
              : 'We received your payment but couldn’t confirm it yet. Please refresh in a minute — don’t pay again.',
        });
      } finally {
        setPayingId(null);
      }
    },
    [open, onPaid],
  );

  const onDismiss = useCallback(
    (message?: string) => {
      const id = open?.appointmentId;
      setOpen(null);
      setPayingId(null);
      if (id && message) setError({ id, message });
    },
    [open],
  );

  const checkout: CheckoutProps = { order: open?.order ?? null, appointmentId: open?.appointmentId ?? null, onSuccess, onDismiss };
  return { pay, payingId, error, checkout };
}
