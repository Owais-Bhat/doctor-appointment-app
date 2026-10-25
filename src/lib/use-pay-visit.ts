"use client";

import { useCallback, useState } from "react";
import { useAuthedFetch } from "./use-api";

/** Razorpay Checkout loads from their CDN the first time someone pays. */
const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

type RazorpayResult = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RazorpayInstance = { open(): void; on(event: "payment.failed", cb: (r: { error?: { description?: string } }) => void): void };
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

let loading: Promise<boolean> | null = null;
function loadCheckout(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  loading ??= new Promise<boolean>((resolve) => {
    const s = document.createElement("script");
    s.src = CHECKOUT_SRC;
    s.async = true;
    s.onload = () => resolve(!!window.Razorpay);
    s.onerror = () => {
      loading = null; // allow a retry after a network blip
      resolve(false);
    };
    document.head.appendChild(s);
  });
  return loading;
}

type Order = {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  description: string;
  prefill: { name: string; email: string; contact: string };
};

/**
 * Pay for a confirmed visit: create (or reuse) the order, open Razorpay
 * Checkout, then have the server verify the signed result.
 */
export function usePayVisit(onPaid: (appointmentId: string) => void) {
  const authedFetch = useAuthedFetch();
  const [payingId, setPayingId] = useState<string | null>(null);
  const [error, setError] = useState<{ id: string; message: string } | null>(null);

  const pay = useCallback(
    async (appointmentId: string) => {
      setPayingId(appointmentId);
      setError(null);
      const fail = (message: string) => {
        setError({ id: appointmentId, message });
        setPayingId(null);
      };
      try {
        const [order, ready] = await Promise.all([
          authedFetch<Order>("/api/payments/order", { method: "POST", body: JSON.stringify({ appointmentId }) }),
          loadCheckout(),
        ]);
        if (!ready || !window.Razorpay) return fail("The payment window couldn’t load. Check your connection and try again.");

        const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
        const rzp = new window.Razorpay({
          key: order.keyId,
          order_id: order.orderId,
          amount: order.amount,
          currency: order.currency,
          name: "MedFlow",
          description: order.description,
          prefill: order.prefill,
          notes: { appointmentId },
          theme: /^#[0-9a-f]{3,8}$/i.test(accent) ? { color: accent } : undefined,
          handler: async (result: RazorpayResult) => {
            try {
              await authedFetch("/api/payments/verify", { method: "POST", body: JSON.stringify(result) });
              setPayingId(null);
              onPaid(appointmentId);
            } catch {
              // The webhook still records it; tell the patient not to pay twice
              fail("We received your payment but couldn’t confirm it yet. Please refresh in a minute — don’t pay again.");
            }
          },
          modal: { ondismiss: () => setPayingId(null), confirm_close: true },
        });
        rzp.on("payment.failed", (r) => setError({ id: appointmentId, message: r.error?.description || "The payment didn’t go through. You can try again." }));
        rzp.open();
      } catch (e) {
        fail(e instanceof Error ? e.message : "Payment couldn’t be started");
      }
    },
    [authedFetch, onPaid],
  );

  return { pay, payingId, error, clearError: () => setError(null) };
}
