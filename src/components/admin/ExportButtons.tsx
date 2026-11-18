"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const EXPORTS = [
  { type: "users", label: "Users" },
  { type: "visits", label: "Visits" },
  { type: "payments", label: "Payments" },
] as const;

/** CSV downloads for the admin. The file route needs the sign-in token, so it is fetched, then saved from the browser. */
export function ExportButtons() {
  const { getToken } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const download = async (type: string) => {
    setBusy(type);
    setError("");
    try {
      const token = await getToken();
      const res = await fetch(`/api/super-admin/export?type=${type}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) throw new Error(((await res.json().catch(() => ({}))) as { error?: string }).error || `Request failed (${res.status})`);
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = `medflow-${type}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn’t export");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="col gap-1">
      <div className="row gap-2 wrap" style={{ alignItems: "center" }}>
        <span className="tiny">Download CSV:</span>
        {EXPORTS.map((x) => (
          <button key={x.type} type="button" className="btn btn-ghost btn-sm" disabled={busy !== null} onClick={() => void download(x.type)}>
            <Download size={13} /> {busy === x.type ? "Preparing…" : x.label}
          </button>
        ))}
      </div>
      {error && <span className="tiny sc-bad" role="alert">{error}</span>}
    </div>
  );
}
