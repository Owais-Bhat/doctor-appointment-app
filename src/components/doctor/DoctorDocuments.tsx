"use client";

import { useState } from "react";
import { FileUp, Trash2 } from "lucide-react";
import { ReportLink } from "@/components/shared/ReportLink";
import { useApi, useAuthedFetch } from "@/lib/use-api";

type Doc = { id: string; title: string; mime_type: string; size_bytes: number };
const MAX_BYTES = 3 * 1024 * 1024;

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = () => reject(new Error("Couldn’t read the file"));
    r.readAsDataURL(file);
  });
}

/** The doctor's verification documents (e.g. medical registration certificate). Only a super admin can open them. */
export function DoctorDocuments() {
  const authedFetch = useAuthedFetch();
  const docs = useApi<{ documents: Doc[] }>("/api/doctor/documents");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [inputKey, setInputKey] = useState(0);

  const upload = async (file: File) => {
    setMessage(null);
    if (file.size > MAX_BYTES) return setMessage({ ok: false, text: "That file is too large. The limit is 3 MB." });
    setBusy(true);
    try {
      await authedFetch("/api/doctor/documents", { method: "POST", body: JSON.stringify({ title: title.trim() || undefined, fileName: file.name, data: await toBase64(file) }) });
      setTitle("");
      setInputKey((k) => k + 1);
      setMessage({ ok: true, text: "Uploaded. An admin can now see it when verifying you." });
      docs.reload();
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : "Couldn’t upload the file" });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (d: Doc) => {
    if (!window.confirm(`Delete “${d.title}”?`)) return;
    try {
      await authedFetch(`/api/doctor/documents/${d.id}`, { method: "DELETE" });
      docs.reload();
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : "Couldn’t delete" });
    }
  };

  return (
    <section className="vrow-panel" aria-labelledby="dd-title">
      <h2 className="h-4" id="dd-title">Verification documents</h2>
      <p className="small">Upload your medical registration certificate and degree so an admin can verify you. Photos or PDFs up to 3 MB; only admins can open them.</p>
      <input className="input" placeholder="Name, e.g. Registration certificate" maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Document name" />
      <label className="btn btn-primary btn-sm" style={{ alignSelf: "flex-start", cursor: busy ? "wait" : "pointer" }}>
        <FileUp size={14} /> {busy ? "Uploading…" : "Choose a photo or PDF"}
        <input key={inputKey} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" hidden disabled={busy} onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); }} />
      </label>
      {message && <p className={message.ok ? "tiny sc-ok" : "bk-error"} role="status" style={message.ok ? undefined : { position: "static" }}>{message.text}</p>}
      {(docs.data?.documents ?? []).map((d) => (
        <div key={d.id} className="row between" style={{ alignItems: "center" }}>
          <ReportLink id={d.id} title={d.title} mime={d.mime_type} path={`/api/doctor/documents/${d.id}`} />
          <button type="button" className="vrow-link" onClick={() => void remove(d)}><Trash2 size={13} /> Delete</button>
        </div>
      ))}
    </section>
  );
}
