"use client";

import { Suspense, useCallback, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Building2, CalendarPlus, Check, ClipboardList, CreditCard, Phone, Star, Video, X } from "lucide-react";
import { Headshot } from "@/components/medflow/Prototype";
import { PaymentTag, paymentState } from "@/components/shared/PaymentTag";
import { useApi, useAuthedFetch } from "@/lib/use-api";
import { usePayVisit } from "@/lib/use-pay-visit";
import { canJoinVideo } from "@/lib/video";
import { clinicInstant } from "@/lib/clinic-time";
import { STATUS_LABEL, VISIT_TYPE_LABEL, doctorName, formatDay, formatTime, nameHue, toISODate } from "@/lib/format";
import { cn } from "@/lib/utils";

type Visit = {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  consultation_type: string;
  chief_complaint: string | null;
  notes: string | null;
  payment_status: string | null;
  amount_paid: number | null;
  doctor_profiles: { id: string; specialty: string; consultation_fee: number | null; profiles: { full_name: string } | null } | null;
};
type Response = { appointments: Visit[]; paymentsEnabled: boolean };
type Scope = "upcoming" | "past";

const TYPE_ICON = { video: Video, phone: Phone, in_person: Building2 } as const;

const REFUND_MSG: Record<string, string> = {
  pending: "Your refund has started. Banks usually take 5–7 working days.",
  refunded: "Your payment has been refunded.",
  failed: "We couldn’t start your refund automatically. Our team will process it and let you know.",
};

function VisitCard({
  visit,
  paymentsEnabled,
  pay,
  paying,
  payError,
  onChange,
  onNotice,
}: {
  visit: Visit;
  paymentsEnabled: boolean;
  pay: (id: string) => void;
  paying: boolean;
  payError: string | null;
  onChange: (v: Partial<Visit>) => void;
  onNotice: (msg: string) => void;
}) {
  const authedFetch = useAuthedFetch();
  const [mode, setMode] = useState<"idle" | "cancel" | "review">("idle");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewed, setReviewed] = useState(false);

  const name = doctorName(visit.doctor_profiles?.profiles?.full_name);
  const TypeIcon = TYPE_ICON[visit.consultation_type as keyof typeof TYPE_ICON] ?? Building2;
  const { status } = visit;
  const payment = paymentState({ ...visit, fee: visit.doctor_profiles?.consultation_fee }, paymentsEnabled);
  const canJoin = status === "confirmed" && visit.consultation_type === "video" && canJoinVideo(visit.appointment_date, visit.appointment_time);
  const paid = payment?.kind === "paid";
  // Patients can cancel (with a full refund) until the visit starts
  const startsAt = clinicInstant(visit.appointment_date, visit.appointment_time.substring(0, 5)).getTime();
  const canCancel = (status === "pending" || status === "confirmed") && Date.now() < startsAt;

  const cancel = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await authedFetch<{ refund?: string }>(`/api/patient/appointments/${visit.id}/cancel`, { method: "POST" });
      onChange({ status: "cancelled", ...(res.refund && res.refund !== "none" ? { payment_status: res.refund === "refunded" ? "refunded" : "refund_pending" } : {}) });
      onNotice(res.refund && REFUND_MSG[res.refund] ? `Visit cancelled. ${REFUND_MSG[res.refund]}` : "Visit cancelled. The doctor has been told.");
      setMode("idle");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn’t cancel");
    } finally {
      setBusy(false);
    }
  };

  const review = async () => {
    setBusy(true);
    setError("");
    try {
      await authedFetch("/api/patient/reviews", { method: "POST", body: JSON.stringify({ appointmentId: visit.id, rating, comment }) });
      setReviewed(true);
      setMode("idle");
      onNotice("Thanks for your review.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Couldn’t save your review";
      if (/already reviewed/i.test(msg)) {
        setReviewed(true);
        setMode("idle");
      } else setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className={cn("vrow", `vrow-${status}`, payment?.kind === "due" && "vrow-due")}>
      <div className="vrow-time">
        <span className="vrow-clock">{formatTime(visit.appointment_time)}</span>
        <span className="tiny">{formatDay(visit.appointment_date)}</span>
      </div>

      <div className="vrow-main">
        <div className="vrow-who">
          <Headshot name={name} hue={nameHue(name)} size={40} />
          <div className="col" style={{ gap: 2, minWidth: 0 }}>
            <span className="vrow-name mf-ellipsis">{name}</span>
            <span className="tiny">{visit.doctor_profiles?.specialty}</span>
          </div>
        </div>

        <div className="vrow-tags">
          <span className="vrow-type"><TypeIcon size={13} /> {VISIT_TYPE_LABEL[visit.consultation_type] ?? "Visit"}</span>
          <span className={cn("vrow-status", status)}>{STATUS_LABEL[status] ?? status}</span>
          <PaymentTag state={payment} />
        </div>

        {visit.chief_complaint && <p className="vrow-reason">“{visit.chief_complaint}”</p>}
        {status === "completed" && visit.notes && <p className="vrow-notes"><ClipboardList size={13} /> {visit.notes}</p>}

        {mode === "cancel" && (
          <div className="vrow-panel" role="group" aria-label="Cancel visit">
            <p className="small">
              Cancel your visit with {name}?{" "}
              {paid ? <>Your payment will be refunded in full (<Link href="/refunds" target="_blank">refund policy</Link>).</> : "The doctor will be told and the slot freed."}
            </p>
            <div className="row gap-2 wrap">
              <button type="button" className="btn btn-sm vrow-danger" disabled={busy} onClick={cancel}>{busy ? "Cancelling…" : "Cancel visit"}</button>
              <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => setMode("idle")}>Keep it</button>
            </div>
          </div>
        )}

        {mode === "review" && (
          <div className="vrow-panel" role="group" aria-label={`Review ${name}`}>
            <span className="mf-label">How was your visit?</span>
            <div className="pt-stars" role="radiogroup" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setRating(n)}>
                  <Star size={24} fill={n <= rating ? "currentColor" : "none"} />
                </button>
              ))}
            </div>
            <textarea className="input" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="What went well? Anything to improve? (optional)" aria-label="Comment" />
            <div className="row gap-2">
              <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={review}>{busy ? "Saving…" : "Submit review"}</button>
              <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => setMode("idle")}>Not now</button>
            </div>
          </div>
        )}

        {(error || payError) && <p className="bk-error" role="alert" style={{ position: "static" }}>{error || payError}</p>}
      </div>

      {mode === "idle" && (
        <div className="vrow-actions">
          {payment?.kind === "due" && (
            <button type="button" className="btn btn-primary btn-sm" disabled={paying} onClick={() => pay(visit.id)}>
              <CreditCard size={14} /> {paying ? "Opening…" : `Pay ${payment.label.replace(" to pay", "")}`}
            </button>
          )}
          {canJoin && payment?.kind !== "due" && (
            <Link className="btn btn-primary btn-sm" href={`/client/visit/${visit.id}`}><Video size={14} /> Join video</Link>
          )}
          {(status === "pending" || status === "confirmed") && (
            <>
              <Link className="btn btn-ghost btn-sm" href={`/client/intake/${visit.id}`}>
                <ClipboardList size={14} /> {visit.chief_complaint ? "Edit details" : "Add details"}
              </Link>
              {canCancel && <button type="button" className="vrow-link" onClick={() => setMode("cancel")}><X size={13} /> Cancel visit</button>}
            </>
          )}
          {status === "completed" && !reviewed && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMode("review")}><Star size={14} /> Rate visit</button>
          )}
          {status === "completed" && reviewed && <span className="tiny row gap-1" style={{ justifyContent: "center" }}><Check size={13} /> Reviewed</span>}
        </div>
      )}
    </li>
  );
}

function Visits() {
  const params = useSearchParams();
  const reduce = useReducedMotion();
  const scope: Scope = params.get("tab") === "past" ? "past" : "upcoming";
  const { data, loading, error, reload } = useApi<Response>("/api/patient/appointments");
  const [patch, setPatch] = useState<Record<string, Partial<Visit>>>({});
  const [notice, setNotice] = useState("");

  const update = useCallback((id: string, p: Partial<Visit>) => setPatch((s) => ({ ...s, [id]: { ...s[id], ...p } })), []);
  const onPaid = useCallback(
    (id: string) => {
      update(id, { payment_status: "paid" });
      setNotice("Payment received. Your receipt is in your notifications.");
      reload();
    },
    [update, reload],
  );
  const { pay, payingId, error: payError } = usePayVisit(onPaid);

  const today = toISODate(new Date());
  const all = (data?.appointments ?? []).map((v) => ({ ...v, ...patch[v.id] }));
  const isUpcoming = (v: Visit) => ["pending", "confirmed"].includes(v.status) && v.appointment_date >= today;
  const upcoming = all.filter(isUpcoming).sort((a, b) => `${a.appointment_date}${a.appointment_time}`.localeCompare(`${b.appointment_date}${b.appointment_time}`));
  const past = all.filter((v) => !isUpcoming(v)).sort((a, b) => `${b.appointment_date}${b.appointment_time}`.localeCompare(`${a.appointment_date}${a.appointment_time}`));
  const list = scope === "upcoming" ? upcoming : past;
  const due = upcoming.filter((v) => paymentState({ ...v, fee: v.doctor_profiles?.consultation_fee }, !!data?.paymentsEnabled)?.kind === "due").length;

  return (
    <div className="dr">
      <header className="dr-head">
        <div className="col" style={{ gap: 4 }}>
          <h1 className="h-1">Your visits</h1>
          <p className="small">
            {due > 0 ? `${due} confirmed visit${due > 1 ? "s are" : " is"} waiting for payment.` : "Join video visits, pay, and keep track of your care."}
          </p>
        </div>
        <div className="row gap-3 wrap" style={{ alignItems: "center" }}>
          <nav className="dr-tabs" aria-label="Visit lists">
            {(["upcoming", "past"] as const).map((t) => (
              <Link key={t} href={`/client/appointments${t === "past" ? "?tab=past" : ""}`} replace className={cn("dr-tab", t === scope && "on")} aria-current={t === scope ? "page" : undefined}>
                {t === "upcoming" ? "Upcoming" : "Past"}
                {t === "upcoming" && upcoming.length > 0 && <span className="dr-count">{upcoming.length}</span>}
              </Link>
            ))}
          </nav>
          <Link href="/client/book" className="btn btn-primary btn-sm"><CalendarPlus size={14} /> Book a visit</Link>
        </div>
      </header>

      <AnimatePresence>
        {notice && (
          <motion.div
            key={notice}
            className="pay-notice"
            role="status"
            initial={reduce ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Check size={16} /> <span className="grow">{notice}</span>
            <button type="button" className="vrow-link" aria-label="Dismiss" onClick={() => setNotice("")}><X size={14} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <ul className="vrow-list" aria-busy="true">
          {[0, 1, 2].map((i) => <li key={i} className="bk-skeleton" style={{ minHeight: 96, borderRadius: 18 }} />)}
        </ul>
      ) : error ? (
        <div className="bk-empty">
          <p className="h-4">Your visits couldn’t be loaded</p>
          <p className="small">{error}.</p>
          <button type="button" className="btn btn-ghost btn-sm" onClick={reload}>Try again</button>
        </div>
      ) : list.length === 0 ? (
        <div className="bk-empty">
          <p className="h-4">{scope === "upcoming" ? "No visits coming up" : "No past visits yet"}</p>
          <p className="small">{scope === "upcoming" ? "Find a doctor and pick a time that suits you." : "Visits you’ve had or cancelled will show here."}</p>
          {scope === "upcoming" && <Link href="/client/book" className="btn btn-primary btn-sm"><CalendarPlus size={14} /> Book a visit</Link>}
        </div>
      ) : (
        <ul className="vrow-list">
          {list.map((v) => (
            <VisitCard
              key={v.id}
              visit={v}
              paymentsEnabled={!!data?.paymentsEnabled}
              pay={pay}
              paying={payingId === v.id}
              payError={payError?.id === v.id ? payError.message : null}
              onChange={(p) => update(v.id, p)}
              onNotice={setNotice}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ClientAppointments() {
  return (
    <Suspense fallback={<div className="dr bk-skeleton" style={{ minHeight: 320, borderRadius: 18 }} />}>
      <Visits />
    </Suspense>
  );
}
