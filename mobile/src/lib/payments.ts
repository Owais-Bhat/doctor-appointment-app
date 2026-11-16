import { formatMoney } from './format';
import type { Appointment } from './types';

/** What POST /api/payments/order returns: everything Razorpay Checkout needs. */
export type CheckoutOrder = {
  keyId: string;
  orderId: string;
  /** Smallest currency unit (paise). The server sets it from the doctor's fee. */
  amount: number;
  currency: string;
  description: string;
  prefill: { name: string; email: string; contact: string };
};

/** What Checkout hands back on success; the server checks the signature. */
export type CheckoutResult = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };

export type CheckoutProps = {
  /** The order to pay. `null` keeps Checkout closed. */
  order: CheckoutOrder | null;
  appointmentId: string | null;
  onSuccess: (result: CheckoutResult) => void;
  /** Closed without paying. `message` is the last failure Razorpay reported, if any. */
  onDismiss: (message?: string) => void;
};

export const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';
export const LOAD_ERROR = 'The payment window couldn’t load. Check your connection and try again.';
export const FAILED = 'The payment didn’t go through. You can try again.';

export function isCheckoutResult(v: unknown): v is CheckoutResult {
  const r = v as Partial<CheckoutResult> | null;
  return !!r && [r.razorpay_order_id, r.razorpay_payment_id, r.razorpay_signature].every((s) => typeof s === 'string' && s.length > 0 && s.length < 200);
}

/** Options for `new Razorpay(...)`, shared by the in-app (WebView) and web checkouts. */
export function checkoutOptions(order: CheckoutOrder, appointmentId: string | null, color: string) {
  return {
    key: order.keyId,
    order_id: order.orderId,
    amount: order.amount,
    currency: order.currency,
    name: 'MedFlow',
    description: order.description,
    prefill: order.prefill,
    notes: appointmentId ? { appointmentId } : undefined,
    theme: { color },
  };
}

/**
 * The page shown inside the in-app WebView: loads Razorpay Checkout, opens it
 * straight away and reports what happened to the app as JSON messages
 * ({ type: 'success' | 'failed' | 'dismiss' | 'error' }).
 */
export function checkoutHtml(options: ReturnType<typeof checkoutOptions>, background: string, ink: string): string {
  // "<" is escaped so a value can never close the script tag
  const json = JSON.stringify(options).replace(/</g, '\\u003c').replace(/[\u2028\u2029]/g, '');
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<style>
  html, body { margin: 0; height: 100%; background: ${background}; color: ${ink}; font: 15px -apple-system, system-ui, Roboto, sans-serif; }
  #msg { height: 100%; display: flex; align-items: center; justify-content: center; opacity: .6; }
</style>
</head>
<body>
<div id="msg">Opening secure payment…</div>
<script>
  var options = ${json};
  function send(message) {
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(message));
  }
  function start() {
    try {
      options.handler = function (result) { send({ type: 'success', result: result }); };
      options.modal = { ondismiss: function () { send({ type: 'dismiss' }); }, confirm_close: true };
      var checkout = new Razorpay(options);
      checkout.on('payment.failed', function (r) {
        send({ type: 'failed', message: (r && r.error && r.error.description) || '' });
      });
      checkout.open();
    } catch (e) {
      send({ type: 'error', message: String((e && e.message) || e) });
    }
  }
</script>
<script src="${CHECKOUT_SRC}" onload="start()" onerror="send({ type: 'error', message: 'load' })"></script>
</body>
</html>`;
}

/**
 * UPI apps are opened with links such as upi://pay or phonepe://pay. Chrome on
 * Android wraps them as intent://pay?…#Intent;scheme=upi;…;end, which the app
 * cannot open directly, so turn that back into scheme://pay?…
 */
export function appLinkFromIntent(url: string): string | null {
  const m = /^intent:\/\/([^#]*)#Intent;(.*)$/.exec(url);
  if (!m) return null;
  const scheme = /(?:^|;)scheme=([a-z][a-z0-9+.-]*)/i.exec(m[2])?.[1];
  return scheme ? `${scheme}://${m[1]}` : null;
}

export type PaymentState = { kind: 'due' | 'paid' | 'refunding' | 'refunded' | 'waived'; label: string };

/** What a visit's payment looks like to the patient (same rules as the web app). */
export function paymentState(a: Appointment, paymentsEnabled: boolean): PaymentState | null {
  const fee = Number(a.doctor_profiles?.consultation_fee ?? 0);
  const paid = formatMoney(a.amount_paid ? a.amount_paid / 100 : fee);
  switch (a.payment_status) {
    case 'paid':
      return { kind: 'paid', label: `Paid ${paid}` };
    case 'refund_pending':
      return { kind: 'refunding', label: `Refund of ${paid} in progress` };
    case 'refunded':
      return { kind: 'refunded', label: `${paid} refunded` };
    case 'waived':
      return { kind: 'waived', label: 'No charge' };
  }
  // Unpaid: only ask for money once the doctor has confirmed
  if (paymentsEnabled && fee >= 1 && a.status === 'confirmed') return { kind: 'due', label: `${formatMoney(fee)} to pay` };
  return null;
}
