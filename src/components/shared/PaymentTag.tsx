import { BadgeCheck, CreditCard, RotateCcw } from "lucide-react";
import { formatFee } from "@/lib/format";
import { cn } from "@/lib/utils";

export type PaymentFields = {
  status: string;
  payment_status?: string | null;
  amount_paid?: number | null;
  /** Doctor's fee in major units (₹) */
  fee?: number | string | null;
};

/** What a visit's payment looks like to people: due, paid, refunding or refunded. */
export function paymentState(v: PaymentFields, paymentsEnabled: boolean) {
  const ps = v.payment_status ?? "unpaid";
  const fee = Number(v.fee ?? 0);
  const paidAmount = v.amount_paid ? formatFee(v.amount_paid / 100) : formatFee(fee);
  if (ps === "paid") return { kind: "paid" as const, label: `Paid ${paidAmount}` };
  if (ps === "refund_pending") return { kind: "refunding" as const, label: `Refund of ${paidAmount} in progress` };
  if (ps === "refunded") return { kind: "refunded" as const, label: `${paidAmount} refunded` };
  if (ps === "waived") return { kind: "waived" as const, label: "No charge" };
  // Unpaid: only ask for money once the doctor has confirmed
  if (paymentsEnabled && fee >= 1 && v.status === "confirmed") return { kind: "due" as const, label: `${formatFee(fee)} to pay` };
  return null;
}

export function PaymentTag({ state, className }: { state: ReturnType<typeof paymentState>; className?: string }) {
  if (!state) return null;
  const Icon = state.kind === "due" ? CreditCard : state.kind === "paid" || state.kind === "waived" ? BadgeCheck : RotateCcw;
  return (
    <span className={cn("pay-tag", `pay-${state.kind}`, className)}>
      <Icon size={12} /> {state.label}
    </span>
  );
}
