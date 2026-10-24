"use client";

import { useState } from "react";
import { Building2, Check, NotebookPen, Phone, Video, X } from "lucide-react";
import { Headshot } from "@/components/medflow/Prototype";
import { useAuthedFetch } from "@/lib/use-api";
import { STATUS_LABEL, VISIT_TYPE_LABEL, formatTime, nameHue, toISODate } from "@/lib/format";
import Link from "next/link";
import { canJoinVideo } from "@/lib/video";
import { cn } from "@/lib/utils";

export type DoctorVisit = {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  consultation_type: string;
  chief_complaint: string | null;
  notes: string | null;
  profiles: {
    id: string;
    full_name: string;
    phone: string | null;
    date_of_birth: string | null;
    blood_type: string | null;
  } | null;
};

const TYPE_ICON = { video: Video, phone: Phone, in_person: Building2 } as const;

function age(dob: string | null): number | null {
  if (!dob) return null;
  const d = new Date(`${dob}T00:00:00`);
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) a--;
  return a >= 0 && a < 130 ? a : null;
}

type Mode = "idle" | "decline" | "complete" | "notes";

/**
 * One appointment with the actions that make sense for its state:
 * pending → confirm / decline; confirmed → video, complete, no-show, cancel;
 * done → add or edit notes.
 */
export function VisitRow({
  visit,
  showDate = false,
  onChanged,
}: {
  visit: DoctorVisit;
  showDate?: boolean;
  /** Called with the updated visit after a successful action. */
  onChanged: (v: DoctorVisit) => void;
}) {
  const authedFetch = useAuthedFetch();
  const [mode, setMode] = useState<Mode>("idle");
  const [notes, setNotes] = useState(visit.notes ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const patient = visit.profiles;
  const name = patient?.full_name ?? "Patient";
  const years = age(patient?.date_of_birth ?? null);
  const TypeIcon = TYPE_ICON[visit.consultation_type as keyof typeof TYPE_ICON] ?? Building2;
  const today = toISODate(new Date());
  const isPastOrToday = visit.appointment_date <= today;
  const { status } = visit;

  const send = async (body: { status?: string; notes?: string }) => {
    setBusy(true);
    setError("");
    try {
      const res = await authedFetch<{ appointment: Partial<DoctorVisit> }>(`/api/doctor/appointments/${visit.id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      setMode("idle");
      onChanged({ ...visit, ...res.appointment, profiles: visit.profiles });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const dateLabel = new Date(`${visit.appointment_date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <li className={cn("vrow", `vrow-${status}`)}>
      <div className="vrow-time">
        <span className="vrow-clock">{formatTime(visit.appointment_time)}</span>
        {showDate && <span className="tiny">{dateLabel}</span>}
      </div>

      <div className="vrow-main">
        <div className="vrow-who">
          <Headshot name={name} hue={nameHue(name)} size={40} />
          <div className="col" style={{ gap: 2, minWidth: 0 }}>
            <span className="vrow-name mf-ellipsis">{name}</span>
            <span className="tiny">
              {[years !== null ? `${years} yrs` : null, patient?.blood_type ? `Blood ${patient.blood_type}` : null, patient?.phone]
                .filter(Boolean)
                .join(" · ") || "No details on file"}
            </span>
          </div>
        </div>

        <div className="vrow-tags">
          <span className="vrow-type">
            <TypeIcon size={13} /> {VISIT_TYPE_LABEL[visit.consultation_type] ?? "Visit"}
          </span>
          {status !== "confirmed" && status !== "pending" && (
            <span className={cn("vrow-status", status)}>{STATUS_LABEL[status] ?? status}</span>
          )}
        </div>

        {visit.chief_complaint && <p className="vrow-reason">“{visit.chief_complaint}”</p>}
        {visit.notes && mode !== "notes" && mode !== "complete" && (
          <p className="vrow-notes">
            <NotebookPen size={13} /> {visit.notes}
          </p>
        )}

        {/* Inline panels */}
        {mode === "decline" && (
          <div className="vrow-panel" role="group" aria-label="Decline request">
            <p className="small">
              {status === "pending" ? "Decline this request?" : "Cancel this visit?"} {name.split(" ")[0]} will be notified.
            </p>
            <div className="row gap-2">
              <button type="button" className="btn btn-sm vrow-danger" disabled={busy} onClick={() => send({ status: "cancelled" })}>
                {busy ? "Saving…" : status === "pending" ? "Decline request" : "Cancel visit"}
              </button>
              <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => setMode("idle")}>
                Keep it
              </button>
            </div>
          </div>
        )}

        {(mode === "complete" || mode === "notes") && (
          <div className="vrow-panel">
            <label className="mf-label" htmlFor={`notes-${visit.id}`}>
              Visit notes {mode === "complete" && <span className="mf-muted">(optional)</span>}
            </label>
            <textarea
              id={`notes-${visit.id}`}
              className="input"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Diagnosis, advice, follow-up"
            />
            <div className="row gap-2">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={busy}
                onClick={() => send(mode === "complete" ? { status: "completed", notes } : { notes })}
              >
                {busy ? "Saving…" : mode === "complete" ? "Mark complete" : "Save notes"}
              </button>
              <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => setMode("idle")}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {error && (
          <p className="bk-error" role="alert" style={{ position: "static" }}>
            {error}
          </p>
        )}
      </div>

      {mode === "idle" && (
        <div className="vrow-actions">
          {status === "pending" && (
            <>
              <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => send({ status: "confirmed" })}>
                <Check size={14} /> {busy ? "Confirming…" : "Confirm"}
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMode("decline")}>
                Decline
              </button>
            </>
          )}
          {status === "confirmed" && (
            <>
              {visit.consultation_type === "video" && canJoinVideo(visit.appointment_date, visit.appointment_time) && (
                <Link className="btn btn-primary btn-sm" href={`/admin/visit/${visit.id}`}>
                  <Video size={14} /> Start video
                </Link>
              )}
              {isPastOrToday && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMode("complete")}>
                  <Check size={14} /> Complete
                </button>
              )}
              {isPastOrToday ? (
                <button type="button" className="vrow-link" disabled={busy} onClick={() => send({ status: "no_show" })}>
                  Didn’t attend
                </button>
              ) : (
                <button type="button" className="vrow-link" onClick={() => setMode("decline")}>
                  <X size={13} /> Cancel visit
                </button>
              )}
            </>
          )}
          {(status === "completed" || status === "no_show") && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMode("notes")}>
              <NotebookPen size={14} /> {visit.notes ? "Edit notes" : "Add notes"}
            </button>
          )}
        </div>
      )}
    </li>
  );
}
