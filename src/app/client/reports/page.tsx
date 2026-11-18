"use client";

import { useCallback, useState } from "react";
import { FileUp, Share2, Trash2 } from "lucide-react";
import { ReportLink } from "@/components/shared/ReportLink";
import { useApi, useAuthedFetch } from "@/lib/use-api";
import { formatDay, formatTime } from "@/lib/format";

type Report = { id: string; title: string; mime_type: string; size_bytes: number; appointment_id: string | null; created_at: string };
type Visit = { id: string; appointment_date: string; appointment_time: string; status: string; doctor_profiles: { profiles: { full_name: string } | null } | null };

const MAX_BYTES = 3 * 1024 * 1024;
const kb = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = () => reject(new Error("Couldn’t read the file"));
    r.readAsDataURL(file);
  });
}

export default function ReportsPage() {
  const authedFetch = useAuthedFetch();
  const reports = useApi<{ reports: Report[] }>("/api/patient/reports");
  const visits = useApi<{ appointments: Visit[] }>("/api/patient/appointments");
  const [title, setTitle] = useState("");
  const [visitId, setVisitId] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [inputKey, setInputKey] = useState(0);

  // Visits a doctor could still look at the report for
  const open = (visits.data?.appointments ?? []).filter((a) => a.status === "pending" || a.status === "confirmed" || a.status === "completed");
  const label = (a: Visit) => `${formatDay(a.appointment_date)} ${formatTime(a.appointment_time)} · ${a.doctor_profiles?.profiles?.full_name ?? "Doctor"}`;
  const visitLabel = (id: string | null) => {
    const a = open.find((v) => v.id === id);
    return a ? label(a) : null;
  };

  const upload = useCallback(
    async (file: File) => {
      setMessage(null);
      if (file.size > MAX_BYTES) return setMessage({ ok: false, text: "That file is too large. The limit is 3 MB." });
      setBusy(true);
      try {
        const data = await toBase64(file);
        await authedFetch("/api/patient/reports", { method: "POST", body: JSON.stringify({ title: title.trim() || undefined, fileName: file.name, data, appointmentId: visitId || undefined }) });
        setTitle("");
        setInputKey((k) => k + 1);
        setMessage({ ok: true, text: "Uploaded." });
        reports.reload();
      } catch (e) {
        setMessage({ ok: false, text: e instanceof Error ? e.message : "Couldn’t upload the file" });
      } finally {
        setBusy(false);
      }
    },
    [authedFetch, title, visitId, reports],
  );

  const attach = async (r: Report, appointmentId: string | null) => {
    setMessage(null);
    try {
      await authedFetch(`/api/patient/reports/${r.id}`, { method: "PATCH", body: JSON.stringify({ appointmentId }) });
      reports.reload();
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : "Couldn’t update the report" });
    }
  };

  const remove = async (r: Report) => {
    if (!window.confirm(`Delete “${r.title}”? This can’t be undone.`)) return;
    try {
      await authedFetch(`/api/patient/reports/${r.id}`, { method: "DELETE" });
      reports.reload();
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : "Couldn’t delete the report" });
    }
  };

  const list = reports.data?.reports ?? [];

  return (
    <div className="dr">
      <header className="dr-head">
        <div className="col" style={{ gap: 4 }}>
          <h1 className="h-1">Your reports</h1>
          <p className="small">Upload test results, scans and old prescriptions. Only the doctor of a visit you share a report with can open it.</p>
        </div>
      </header>

      <section className="vrow-panel" aria-label="Upload a report">
        <span className="mf-label">Add a report</span>
        <input className="input" placeholder="Name, e.g. Blood test, March" maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Report name" />
        <select className="input" value={visitId} onChange={(e) => setVisitId(e.target.value)} aria-label="Share with the doctor of a visit">
          <option value="">Don’t share with a doctor yet</option>
          {open.map((a) => (
            <option key={a.id} value={a.id}>Share with: {label(a)}</option>
          ))}
        </select>
        <label className="btn btn-primary btn-sm" style={{ alignSelf: "flex-start", cursor: busy ? "wait" : "pointer" }}>
          <FileUp size={14} /> {busy ? "Uploading…" : "Choose a photo or PDF"}
          <input key={inputKey} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" hidden disabled={busy} onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); }} />
        </label>
        <span className="tiny">JPEG, PNG, WebP or PDF, up to 3 MB.</span>
        {message && <p className={message.ok ? "tiny sc-ok" : "bk-error"} role="status" style={message.ok ? undefined : { position: "static" }}>{message.text}</p>}
      </section>

      {reports.loading ? (
        <div className="bk-skeleton" style={{ minHeight: 120, borderRadius: 18 }} aria-busy="true" />
      ) : reports.error ? (
        <p className="bk-error" role="alert" style={{ position: "static" }}>{reports.error}</p>
      ) : list.length === 0 ? (
        <div className="bk-empty"><p className="h-4">No reports yet</p><p className="small">Add one above and share it with your doctor before a visit.</p></div>
      ) : (
        <ul className="col gap-2" style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {list.map((r) => (
            <li key={r.id} className="vrow-panel">
              <div className="row between" style={{ alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <ReportLink id={r.id} title={r.title} mime={r.mime_type} />
                <span className="tiny">{kb(r.size_bytes)} · {formatDay(r.created_at.substring(0, 10))}</span>
              </div>
              <div className="row gap-2 wrap" style={{ alignItems: "center" }}>
                <Share2 size={13} aria-hidden="true" />
                <select className="input" style={{ maxWidth: 360 }} value={r.appointment_id ?? ""} onChange={(e) => void attach(r, e.target.value || null)} aria-label={`Share ${r.title} with the doctor of a visit`}>
                  <option value="">Not shared</option>
                  {r.appointment_id && !visitLabel(r.appointment_id) && <option value={r.appointment_id}>Shared with a visit</option>}
                  {open.map((a) => (
                    <option key={a.id} value={a.id}>{label(a)}</option>
                  ))}
                </select>
                <button type="button" className="vrow-link" onClick={() => void remove(r)}><Trash2 size={13} /> Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
