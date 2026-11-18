"use client";

import { useState } from "react";
import { Check, Pill, Plus, Printer, Trash2 } from "lucide-react";
import { useAuthedFetch } from "@/lib/use-api";
import { formatDay } from "@/lib/format";
import type { Prescription, PrescriptionItem } from "@/lib/prescription";
import { cn } from "@/lib/utils";

const FREQUENCIES = ["Once a day", "Twice a day", "3 times a day", "At night", "When needed"];
const blank = (): PrescriptionItem => ({ name: "", dose: "", frequency: "", duration: "", note: "" });

/** One medicine as a readable line: "Paracetamol 500 mg — Twice a day for 5 days". */
function line(i: PrescriptionItem) {
  const how = [i.frequency, i.duration ? `for ${i.duration}` : ""].filter(Boolean).join(" ");
  return [[i.name, i.dose].filter(Boolean).join(" "), how].filter(Boolean).join(" — ");
}

/** The prescription as it prints: clean sheet, only this block is visible on paper (see .rx-sheet in globals.css). */
function Sheet({ rx, followUp, doctor, date }: { rx: Prescription; followUp: string | null; doctor: string; date: string }) {
  return (
    <div className="rx-sheet">
      <div className="rx-head">
        <b>MedFlow · Prescription</b>
        <span className="tiny">{doctor} · {formatDay(date)}</span>
      </div>
      <ol className="rx-list">
        {rx.items.map((i, n) => (
          <li key={n}>
            <b>{line(i)}</b>
            {i.note && <span className="small"> {i.note}</span>}
          </li>
        ))}
      </ol>
      {rx.advice && (
        <p className="body" style={{ whiteSpace: "pre-wrap" }}>
          <b>Advice: </b>{rx.advice}
        </p>
      )}
      {followUp && <p className="body"><b>Follow-up: </b>{formatDay(followUp)}</p>}
    </div>
  );
}

type Props = {
  visitId: string;
  role: "patient" | "doctor";
  status: string;
  date: string;
  doctorName: string;
  prescription: Prescription | null;
  followUpDate: string | null;
  onSaved: () => void;
};

/** Doctor: write or update the prescription. Patient: read it, print it or save it as a PDF. */
export function PrescriptionPanel({ visitId, role, status, date, doctorName, prescription, followUpDate, onSaved }: Props) {
  const authedFetch = useAuthedFetch();
  const [items, setItems] = useState<PrescriptionItem[]>(prescription?.items.length ? prescription.items : [blank()]);
  const [advice, setAdvice] = useState(prescription?.advice ?? "");
  const [followUp, setFollowUp] = useState(followUpDate ?? "");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  const setItem = (n: number, patch: Partial<PrescriptionItem>) => {
    setItems((all) => all.map((it, i) => (i === n ? { ...it, ...patch } : it)));
    setState("idle");
  };

  if (role === "patient") {
    if (!prescription) return null;
    return (
      <section className="vv-rx glass-strong" aria-labelledby="rx-title">
        <div className="row between" style={{ alignItems: "center" }}>
          <h2 className="h-3" id="rx-title"><Pill size={18} style={{ display: "inline", verticalAlign: -3 }} /> Your prescription</h2>
          <button type="button" className="btn btn-ghost btn-sm rx-noprint" onClick={() => window.print()}>
            <Printer size={14} /> Print or save as PDF
          </button>
        </div>
        <Sheet rx={prescription} followUp={followUpDate} doctor={doctorName} date={date} />
      </section>
    );
  }

  // Only a visit that is happening or happened can have a prescription
  if (status !== "confirmed" && status !== "completed") return null;

  const filled = items.filter((i) => i.name.trim());
  const followUpOk = followUp === "" || /^\d{4}-\d{2}-\d{2}$/.test(followUp);

  const save = async () => {
    setState("saving");
    setError("");
    try {
      const rx = filled.length || advice.trim() ? { items: filled, advice: advice.trim() } : null;
      await authedFetch(`/api/doctor/appointments/${visitId}`, { method: "PATCH", body: JSON.stringify({ prescription: rx, followUpDate: followUp || null }) });
      setState("saved");
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn’t save the prescription");
      setState("error");
    }
  };

  return (
    <section className="vv-rx glass-strong" aria-labelledby="rx-title">
      <div className="row between" style={{ alignItems: "center" }}>
        <h2 className="h-3" id="rx-title"><Pill size={18} style={{ display: "inline", verticalAlign: -3 }} /> Prescription</h2>
        {prescription && <span className="tiny sc-ok">The patient can see this</span>}
      </div>

      {items.map((it, n) => (
        <div key={n} className="rx-item">
          <div className="row between" style={{ alignItems: "center" }}>
            <span className="mf-label">Medicine {n + 1}</span>
            {items.length > 1 && (
              <button type="button" className="vrow-link" onClick={() => setItems((all) => all.filter((_, i) => i !== n))} aria-label={`Remove medicine ${n + 1}`}>
                <Trash2 size={13} /> Remove
              </button>
            )}
          </div>
          <div className="rx-grid">
            <input className="input" placeholder="Name, e.g. Paracetamol" maxLength={120} value={it.name} onChange={(e) => setItem(n, { name: e.target.value })} aria-label={`Medicine ${n + 1} name`} />
            <input className="input" placeholder="Dose, e.g. 500 mg" maxLength={60} value={it.dose} onChange={(e) => setItem(n, { dose: e.target.value })} aria-label={`Medicine ${n + 1} dose`} />
            <input className="input" placeholder="For how long, e.g. 5 days" maxLength={60} value={it.duration} onChange={(e) => setItem(n, { duration: e.target.value })} aria-label={`Medicine ${n + 1} duration`} />
            <input className="input" placeholder="Note, e.g. after food" maxLength={200} value={it.note} onChange={(e) => setItem(n, { note: e.target.value })} aria-label={`Medicine ${n + 1} note`} />
          </div>
          <div className="bk-chips">
            {FREQUENCIES.map((f) => (
              <button key={f} type="button" className={cn("bk-chip", it.frequency === f && "on")} aria-pressed={it.frequency === f} onClick={() => setItem(n, { frequency: it.frequency === f ? "" : f })}>
                {f}
              </button>
            ))}
          </div>
        </div>
      ))}

      <button type="button" className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-start" }} onClick={() => setItems((all) => [...all, blank()])}>
        <Plus size={14} /> Add another medicine
      </button>

      <label className="mf-label" htmlFor="rx-advice">Advice</label>
      <textarea id="rx-advice" className="input" rows={3} maxLength={4000} placeholder="Rest, fluids, what to watch for…" value={advice} onChange={(e) => { setAdvice(e.target.value); setState("idle"); }} />

      <label className="mf-label" htmlFor="rx-follow">Follow-up date (optional)</label>
      <input id="rx-follow" type="date" className="input" style={{ maxWidth: 220 }} value={followUp} onChange={(e) => { setFollowUp(e.target.value); setState("idle"); }} />

      <div className="row between" style={{ alignItems: "center" }}>
        <span className={cn("tiny", state === "error" && "sc-bad", state === "saved" && "sc-ok")} role="status">
          {state === "saving" ? "Saving…" : state === "saved" ? "Saved. The patient has been told." : state === "error" ? error : ""}
        </span>
        <button type="button" className="btn btn-primary btn-sm" disabled={state === "saving" || !followUpOk} onClick={save}>
          <Check size={14} /> {prescription ? "Update prescription" : "Save prescription"}
        </button>
      </div>
    </section>
  );
}
