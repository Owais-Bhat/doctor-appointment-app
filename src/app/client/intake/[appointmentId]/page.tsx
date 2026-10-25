"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Check, ClipboardList, Pill, Siren } from "lucide-react";
import { Headshot } from "@/components/medflow/Prototype";
import { useApi, useAuthedFetch } from "@/lib/use-api";
import { VISIT_TYPE_LABEL, doctorName, formatDay, formatTime, nameHue } from "@/lib/format";
import { cn } from "@/lib/utils";

type Intake = { duration?: string | null; severity?: string | null; medications?: string | null; allergies?: string | null } | null;
type Response = {
  appointment: {
    id: string;
    appointment_date: string;
    appointment_time: string;
    status: string;
    consultation_type: string;
    chief_complaint: string | null;
    intake: Intake;
    doctor: { name: string | null; specialty: string | null };
  };
  health: { allergies: string | null; medications: string | null };
  editable: boolean;
};

const SEVERITY = [
  { id: "mild", label: "Mild", hint: "Annoying, but I can go about my day" },
  { id: "moderate", label: "Moderate", hint: "It gets in the way of daily life" },
  { id: "severe", label: "Severe", hint: "Hard to cope, getting worse" },
] as const;

const DURATIONS = ["Today", "2–3 days", "About a week", "Few weeks", "Months or more"];

export default function IntakeFormPage({ params }: { params: Promise<{ appointmentId: string }> }) {
  const { appointmentId } = use(params);
  const { data, loading, error } = useApi<Response>(`/api/patient/intake?appointmentId=${appointmentId}`);
  const authedFetch = useAuthedFetch();
  const reduce = useReducedMotion();

  const [form, setForm] = useState({ reason: "", duration: "", severity: "", medications: "", allergies: "" });
  const [saveToProfile, setSaveToProfile] = useState(true);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!data || ready) return;
    const i = data.appointment.intake ?? {};
    setForm({
      reason: data.appointment.chief_complaint ?? "",
      duration: i.duration ?? "",
      severity: i.severity ?? "",
      medications: i.medications ?? data.health.medications ?? "",
      allergies: i.allergies ?? data.health.allergies ?? "",
    });
    setReady(true);
  }, [data, ready]);

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.reason.trim()) return setSaveError("Tell the doctor why you’re visiting.");
    setSaving(true);
    setSaveError("");
    try {
      await authedFetch("/api/patient/intake", {
        method: "PATCH",
        body: JSON.stringify({
          appointmentId,
          chief_complaint: form.reason,
          duration: form.duration,
          severity: form.severity || null,
          medications: form.medications,
          allergies: form.allergies,
          saveToProfile,
        }),
      });
      setDone(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Couldn’t save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="ik" aria-busy="true">
        <div className="bk-skeleton" style={{ minHeight: 90, borderRadius: 20 }} />
        <div className="bk-skeleton" style={{ minHeight: 420, borderRadius: 22 }} />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="bk-empty">
        <p className="h-4">This visit couldn’t be found</p>
        <p className="small">It may belong to another account.</p>
        <Link href="/client/appointments" className="btn btn-ghost btn-sm">Back to visits</Link>
      </div>
    );
  }

  const a = data.appointment;
  const doc = doctorName(a.doctor.name);
  const when = `${formatDay(a.appointment_date)}, ${formatTime(a.appointment_time)}`;

  if (done) {
    return (
      <motion.section className="bk-done glass-strong ik-done" initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <motion.span className="bk-done-icon" aria-hidden="true" initial={reduce ? false : { scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}>
          <Check size={26} />
        </motion.span>
        <h1 className="h-2">Sent to {doc}</h1>
        <p className="body">They’ll read this before your visit on {when}. You can change it any time before then.</p>
        <div className="row gap-2 wrap" style={{ justifyContent: "center" }}>
          <Link href="/client/appointments" className="btn btn-primary">Back to visits</Link>
          <button type="button" className="btn btn-ghost" onClick={() => setDone(false)}>Edit details</button>
        </div>
      </motion.section>
    );
  }

  return (
    <form className="ik" onSubmit={submit} noValidate>
      <Link href="/client/appointments" className="bk-back"><ArrowLeft size={15} /> Visits</Link>
      <header className="ik-head">
        <Headshot name={doc} hue={nameHue(doc)} size={52} />
        <div className="col" style={{ gap: 3, minWidth: 0 }}>
          <h1 className="h-2">Before your visit</h1>
          <p className="small">
            {doc}{a.doctor.specialty ? ` · ${a.doctor.specialty}` : ""} · {when} · {VISIT_TYPE_LABEL[a.consultation_type] ?? "Visit"}
          </p>
        </div>
      </header>

      {!data.editable && (
        <p className="dr-alert" role="status">This visit has passed or was cancelled, so these details can’t be changed.</p>
      )}

      <fieldset className="ik-card" disabled={!data.editable}>
        <legend className="hp-title"><ClipboardList size={16} /> What’s bothering you?</legend>
        <label className="fm-field">
          <span className="mf-label">Reason for the visit</span>
          <textarea
            className="input"
            rows={4}
            maxLength={1000}
            value={form.reason}
            onChange={(e) => set("reason")(e.target.value)}
            placeholder="e.g. Headache on the left side for a week, worse in the morning. Paracetamol helps a little."
            aria-invalid={!!saveError && !form.reason.trim()}
          />
          <span className="tiny">What you feel, when it started, and anything that makes it better or worse.</span>
        </label>

        <div className="fm-field">
          <span className="mf-label" id="ik-dur">How long has this been going on?</span>
          <div className="bk-chips" role="radiogroup" aria-labelledby="ik-dur">
            {DURATIONS.map((d) => (
              <button key={d} type="button" role="radio" aria-checked={form.duration === d} className={cn("bk-chip", form.duration === d && "on")} onClick={() => set("duration")(form.duration === d ? "" : d)}>
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="fm-field">
          <span className="mf-label" id="ik-sev">How bad is it?</span>
          <div className="ik-sev" role="radiogroup" aria-labelledby="ik-sev">
            {SEVERITY.map((s) => (
              <button key={s.id} type="button" role="radio" aria-checked={form.severity === s.id} className={cn("ik-sev-opt", `sev-${s.id}`, form.severity === s.id && "on")} onClick={() => set("severity")(form.severity === s.id ? "" : s.id)}>
                <b>{s.label}</b>
                <span className="tiny">{s.hint}</span>
              </button>
            ))}
          </div>
          {form.severity === "severe" && (
            <motion.p className="ik-urgent" role="alert" initial={reduce ? false : { opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
              <Siren size={16} />
              <span>If you have chest pain, trouble breathing, fainting, or sudden weakness, don’t wait for this visit — call <a href="tel:112">112</a> or go to the nearest emergency room.</span>
            </motion.p>
          )}
        </div>
      </fieldset>

      <fieldset className="ik-card" disabled={!data.editable}>
        <legend className="hp-title"><Pill size={16} /> Medicines and allergies</legend>
        <div className="fm-grid">
          <label className="fm-field">
            <span className="mf-label">Medicines you take</span>
            <textarea className="input" rows={2} maxLength={300} value={form.medications} onChange={(e) => set("medications")(e.target.value)} placeholder="Name and dose, or “None”" />
          </label>
          <label className="fm-field">
            <span className="mf-label">Allergies</span>
            <textarea className="input" rows={2} maxLength={300} value={form.allergies} onChange={(e) => set("allergies")(e.target.value)} placeholder="Medicines or food, or “None”" />
          </label>
        </div>
        <label className="ik-check">
          <input type="checkbox" checked={saveToProfile} onChange={(e) => setSaveToProfile(e.target.checked)} />
          <span>Also save these to my health profile for next time</span>
        </label>
      </fieldset>

      {data.editable && (
        <div className="ik-actions">
          {saveError && <p className="bk-error" role="alert" style={{ position: "static" }}>{saveError}</p>}
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Sending…" : `Send to ${doc}`}</button>
        </div>
      )}
    </form>
  );
}
