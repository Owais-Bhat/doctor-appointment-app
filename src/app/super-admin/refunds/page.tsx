"use client";

import { useState } from "react";
import { RotateCw } from "lucide-react";
import { useApi, useAuthedFetch } from "@/lib/use-api";
import { formatDay, formatFee } from "@/lib/format";
import { cn } from "@/lib/utils";

type Refund = { id: string; date: string; time: string; patient: string | null; doctor: string | null; amount: number | null; status: "refund_pending" | "refunded"; refund_id: string | null; refunded_at: string | null; stuck: boolean };

export default function AdminRefunds() {
  const authedFetch = useAuthedFetch();
  const { data, loading, error, reload } = useApi<{ refunds: Refund[]; stuck: number }>("/api/super-admin/refunds");
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const retry = async (r: Refund) => {
    setBusy(r.id);
    setNotice("");
    try {
      const res = await authedFetch<{ message: string }>(`/api/super-admin/refunds/${r.id}`, { method: "POST" });
      setNotice(res.message);
      reload();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Couldn’t retry the refund");
    } finally {
      setBusy(null);
    }
  };

  const list = data?.refunds ?? [];

  return (
    <div className="dr">
      <header className="dr-head">
        <div className="col gap-2">
          <h1 className="h-1">Refunds</h1>
          <p className="body">
            {loading ? "Checking refunds…" : (data?.stuck ?? 0) > 0 ? `${data?.stuck} refund${data?.stuck === 1 ? "" : "s"} did not go through. Try again, or refund from the Razorpay dashboard.` : "Every refund has been sent."}
          </p>
        </div>
      </header>
      {notice && <p className="small" role="status">{notice}</p>}

      {loading ? (
        <div className="bk-skeleton" style={{ minHeight: 160, borderRadius: 18 }} aria-busy="true" />
      ) : error ? (
        <div className="bk-empty"><p className="h-4">Refunds could not be loaded</p><button type="button" className="btn btn-ghost btn-sm" onClick={reload}>Try again</button></div>
      ) : list.length === 0 ? (
        <div className="bk-empty"><p className="h-4">No refunds yet</p><p className="small">When a paid visit is cancelled, its refund shows up here.</p></div>
      ) : (
        <ul className="ad-list">
          {list.map((r) => (
            <li key={r.id} className="ad-row">
              <div className="col" style={{ gap: 2, minWidth: 0 }}>
                <span style={{ fontWeight: 600 }}>{r.patient ?? "Patient"} <span className="tiny">with {r.doctor ?? "doctor"}</span></span>
                <span className="tiny">{formatDay(r.date)} {r.time} · {r.amount !== null ? formatFee(r.amount) : "amount unknown"}</span>
                {r.refund_id && <span className="tiny mf-ellipsis">Razorpay refund {r.refund_id}</span>}
              </div>
              <div className="ad-actions">
                <span className={cn("ad-tag", r.stuck ? "bad" : r.status === "refunded" ? "good" : "")}>
                  {r.stuck ? "Not sent" : r.status === "refunded" ? "Refunded" : "In progress"}
                </span>
                {r.stuck && (
                  <button type="button" className="btn btn-primary btn-sm" disabled={busy !== null} onClick={() => void retry(r)}>
                    <RotateCw size={13} /> {busy === r.id ? "Trying…" : "Try again"}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
