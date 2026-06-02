"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Check, Clock, CreditCard, ExternalLink, FileText, Phone, Star, Video, X } from "lucide-react";
import { Headshot } from "@/components/medflow/Prototype";
import { useAuth } from "@/context/AuthContext";

type Appointment = {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  consultation_type: string;
  chief_complaint: string | null;
  doctor_profiles: {
    specialty: string;
    profiles: { full_name: string };
  };
};

function statusClass(status: string) {
  if (status === "confirmed") return "good";
  if (status === "pending") return "accent";
  if (status === "completed") return "";
  if (status === "cancelled") return "bad";
  return "";
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatTime(timeStr: string) {
  const [h, m] = timeStr.split(":").map(Number);
  return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

function nameHue(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

export default function ClientAppointments() {
  const { user, getToken } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [reviewTarget, setReviewTarget] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());

  // Check payment result from Stripe redirect
  const paymentResult = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("payment")
    : null;

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getToken().then(token =>
      fetch("/api/patient/appointments", { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => setAppointments(d.appointments ?? []))
        .catch(console.error)
        .finally(() => setLoading(false))
    );
  }, [user]);

  const handlePay = async (appointmentId: string) => {
    setPaying(appointmentId);
    const token = await getToken();
    const res = await fetch("/api/payments/checkout", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentId }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      setPaying(null);
    }
  };

  const handleCancel = async (appointmentId: string) => {
    if (!confirm("Cancel this appointment?")) return;
    setCancelling(appointmentId);
    const token = await getToken();
    await fetch(`/api/patient/appointments/${appointmentId}/cancel`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    setAppointments(prev => prev.map(a => a.id === appointmentId ? { ...a, status: "cancelled" } : a));
    setCancelling(null);
  };

  const submitReview = async () => {
    if (!reviewTarget) return;
    setSubmittingReview(true);
    const token = await getToken();
    const res = await fetch("/api/patient/reviews", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentId: reviewTarget, rating: reviewRating, comment: reviewComment }),
    });
    setSubmittingReview(false);
    if (res.ok) {
      setReviewedIds(prev => new Set([...prev, reviewTarget]));
      setReviewTarget(null);
      setReviewComment("");
      setReviewRating(5);
    }
  };

  const joinVideo = (appointmentId: string) => {
    window.open(`https://meet.jit.si/medflow-${appointmentId}`, "_blank", "noopener");
  };

  return (
    <div className="fade-enter col gap-7">
      <div className="row between wrap gap-4">
        <div className="col" style={{ gap: 6 }}>
          <div className="eyebrow">Care schedule</div>
          <h1 className="h-1">Appointments</h1>
          <p className="body">Join visits, pay for consultations, and track your care history.</p>
        </div>
        <a href="/client/book" className="btn btn-primary"><CalendarDays size={14} /> Book another visit</a>
      </div>

      {paymentResult === "success" && (
        <div style={{ padding: "14px 18px", borderRadius: 14, background: "color-mix(in oklab, var(--good) 10%, transparent)", border: "1px solid color-mix(in oklab, var(--good) 30%, transparent)" }}>
          <div className="row gap-3">
            <Check size={16} style={{ color: "var(--good)" }} />
            <div>
              <div style={{ fontWeight: 700 }}>Payment confirmed!</div>
              <div className="small">Your appointment has been confirmed. Check the status below.</div>
            </div>
          </div>
        </div>
      )}

      <div className="glass" style={{ padding: 24 }}>
        {loading ? (
          <div className="col gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: 68, borderRadius: 18, border: "1px solid var(--line)", opacity: 0.4 }} />
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div className="h-3" style={{ marginBottom: 8 }}>No appointments yet</div>
            <div className="small" style={{ marginBottom: 18 }}>Book your first visit to get started.</div>
            <a href="/client/book" className="btn btn-primary btn-sm"><CalendarDays size={14} /> Book now</a>
          </div>
        ) : (
          <div className="col gap-3">
            {appointments.map(appt => {
              const doctorName = appt.doctor_profiles?.profiles?.full_name ?? "Doctor";
              const isToday = appt.appointment_date === new Date().toISOString().split("T")[0];
              const isVideo = appt.consultation_type === "video";
              const isPending = appt.status === "pending";
              const isConfirmed = appt.status === "confirmed";
              const isCompleted = appt.status === "completed";
              const isCancellable = isPending || isConfirmed;
              const canReview = isCompleted && !reviewedIds.has(appt.id);

              return (
                <div key={appt.id} className="row gap-4" style={{ padding: 16, borderRadius: 18, border: "1px solid var(--line)", flexWrap: "wrap" }}>
                  <div className="col" style={{ gap: 2, minWidth: 74 }}>
                    <div className="tnum" style={{ fontWeight: 800 }}>{formatTime(appt.appointment_time)}</div>
                    <div className="tiny">{formatDate(appt.appointment_date)}</div>
                  </div>
                  <div className="vr" />
                  <Headshot name={doctorName} hue={nameHue(doctorName)} size={44} />
                  <div className="grow">
                    <div style={{ fontWeight: 800 }}>{doctorName}</div>
                    <div className="small">
                      {appt.doctor_profiles?.specialty}
                      {appt.chief_complaint ? ` · ${appt.chief_complaint}` : ""}
                    </div>
                  </div>
                  <span className="pill">
                    {isVideo ? <Video size={11} /> : appt.consultation_type === "phone" ? <Phone size={11} /> : <Clock size={11} />}
                    {appt.consultation_type === "in_person" ? "In-person" : appt.consultation_type}
                  </span>
                  <span className={`pill ${statusClass(appt.status)}`}>
                    {appt.status === "confirmed" && <Check size={11} />}
                    {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                  </span>
                  <div className="row gap-2">
                    {isPending && (
                      <button
                        className="btn btn-primary btn-sm"
                        disabled={paying === appt.id}
                        onClick={() => handlePay(appt.id)}
                      >
                        <CreditCard size={13} /> {paying === appt.id ? "Redirecting…" : "Pay now"}
                      </button>
                    )}
                    {isConfirmed && isVideo && isToday && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => joinVideo(appt.id)}
                      >
                        <ExternalLink size={13} /> Join
                      </button>
                    )}
                    <button className="btn btn-glass btn-sm"><FileText size={13} /> Details</button>
                    {canReview && (
                      <button
                        className="btn btn-glass btn-sm"
                        onClick={() => { setReviewTarget(appt.id); setReviewRating(5); setReviewComment(""); }}
                      >
                        <Star size={13} /> Review
                      </button>
                    )}
                    {isCancellable && (
                      <button
                        className="btn btn-glass btn-sm"
                        style={{ color: "var(--bad)" }}
                        disabled={cancelling === appt.id}
                        onClick={() => handleCancel(appt.id)}
                      >
                        <X size={13} /> {cancelling === appt.id ? "Cancelling…" : "Cancel"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {reviewTarget && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
        }}>
          <div className="glass col gap-5" style={{ padding: 28, borderRadius: 20, maxWidth: 420, width: "90%" }}>
            <div className="row between">
              <div className="h-3">Leave a review</div>
              <button onClick={() => setReviewTarget(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-3)" }}>
                <X size={18} />
              </button>
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 10 }}>Rating</div>
              <div className="row gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setReviewRating(star)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
                  >
                    <Star size={28} fill={star <= reviewRating ? "#f59e0b" : "none"} stroke="#f59e0b" />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>Comment (optional)</div>
              <textarea
                className="input"
                rows={3}
                style={{ resize: "vertical", width: "100%" }}
                placeholder="Share your experience…"
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
              />
            </div>
            <div className="row gap-3" style={{ justifyContent: "flex-end" }}>
              <button className="btn btn-glass" onClick={() => setReviewTarget(null)}>Cancel</button>
              <button className="btn btn-primary" disabled={submittingReview} onClick={submitReview}>
                <Star size={13} /> {submittingReview ? "Submitting…" : "Submit review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
