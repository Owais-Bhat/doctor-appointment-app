"use client";

import { useState } from "react";
import { useApi } from "@/lib/use-api";
import { auditLabel, auditTone } from "@/lib/audit-labels";
import { cn } from "@/lib/utils";

type Log = {
  id: string;
  action: string;
  target_table: string | null;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  profiles: { full_name: string; email: string; role: string } | null;
};
type Page = { logs: Log[]; total: number; page: number; limit: number };

const LIMIT = 25;
const ROLE = { patient: "Patient", doctor: "Doctor", super_admin: "Admin" } as Record<string, string>;

export default function AuditLog() {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useApi<Page>(`/api/super-admin/audit-logs?page=${page}&limit=${LIMIT}`);
  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="dr">
      <header className="dr-head">
        <div className="col gap-2">
          <h1 className="h-1">Audit log</h1>
          <p className="body">Every change to accounts, doctors and visits, newest first.</p>
        </div>
      </header>

      {loading ? (
        <div className="bk-skeleton" style={{ minHeight: 320, borderRadius: 18 }} aria-busy="true" />
      ) : error ? (
        <div className="bk-empty">
          <p className="h-4">The audit log could not be loaded</p>
          <button type="button" className="btn btn-ghost btn-sm" onClick={reload}>Try again</button>
        </div>
      ) : (data?.logs ?? []).length === 0 ? (
        <div className="bk-empty">
          <p className="h-4">No activity yet</p>
          <p className="small">Verifying doctors, confirming visits and other changes are recorded here.</p>
        </div>
      ) : (
        <>
          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead>
                <tr>
                  <th scope="col">When</th>
                  <th scope="col">Who</th>
                  <th scope="col">What</th>
                  <th scope="col">Record</th>
                </tr>
              </thead>
              <tbody>
                {data!.logs.map((l) => {
                  const d = new Date(l.created_at);
                  return (
                    <tr key={l.id}>
                      <td className="tnum">
                        {d.toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                        <span className="tiny"> {d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{l.profiles?.full_name ?? "Unknown"}</span>
                        <span className="tiny"> {ROLE[l.profiles?.role ?? ""] ?? ""}</span>
                      </td>
                      <td>
                        <span className={cn("ad-dot", auditTone(l.action))} aria-hidden="true" /> {auditLabel(l.action)}
                      </td>
                      <td className="tiny ad-mono" title={l.target_id ?? undefined}>
                        {l.target_table ? `${l.target_table.replace(/_/g, " ")} · ${l.target_id?.slice(0, 8) ?? ""}` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <nav className="row between" aria-label="Pages">
            <span className="small">
              {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
            </span>
            <span className="row gap-2">
              <button type="button" className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Newer</button>
              <button type="button" className="btn btn-ghost btn-sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Older</button>
            </span>
          </nav>
        </>
      )}
    </div>
  );
}
