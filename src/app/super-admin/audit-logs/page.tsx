"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ShieldAlert, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type LogEntry = {
  id: string;
  action: string;
  target_table: string | null;
  target_id: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
    role: string;
  } | null;
};

const SENSITIVE_ACTIONS = ["rate_limit", "unauthorized", "blocked", "failed"];

function actionColor(action: string) {
  if (SENSITIVE_ACTIONS.some(s => action.includes(s))) return "bad";
  if (action.includes("cancel") || action.includes("demote")) return "bad";
  if (action.includes("promote") || action.includes("verify") || action.includes("confirm") || action.includes("complete")) return "good";
  return "accent";
}

function formatTs(ts: string) {
  return new Date(ts).toLocaleString(undefined, {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function AuditLogsPage() {
  const { user, getToken } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 25;

  const fetchLogs = async (p: number) => {
    setLoading(true);
    const token = await getToken();
    const res = await fetch(`/api/super-admin/audit-logs?page=${p}&limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setLogs(data.logs ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetchLogs(page);
  }, [user]);

  const totalPages = Math.ceil(total / limit);

  const goPage = (p: number) => {
    setPage(p);
    fetchLogs(p);
  };

  return (
    <div className="fade-enter col gap-7">
      <div className="row between wrap gap-4">
        <div>
          <div className="eyebrow">Compliance</div>
          <h1 className="h-1">Audit logs</h1>
          <p className="body">HIPAA, GDPR, CCPA, and enterprise security evidence — all platform actions recorded.</p>
        </div>
        {!loading && <span className="pill accent">{total.toLocaleString()} total events</span>}
      </div>

      <div className="glass" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div className="col gap-3" style={{ padding: 16 }}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} style={{ height: 52, borderRadius: 10, border: "1px solid var(--line)", opacity: 0.4 }} />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div className="small" style={{ color: "var(--ink-3)" }}>No audit events yet.</div>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid var(--line)" }}>
                {["Time", "Actor", "Action", "Target", "Details"].map(h => (
                  <th key={h} style={{ padding: "12px 16px" }}><span className="eyebrow">{h}</span></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map(log => {
                const isSensitive = SENSITIVE_ACTIONS.some(s => log.action.includes(s));
                return (
                  <tr key={log.id} style={{ borderTop: "1px solid var(--line)" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div className="tiny mono">{formatTs(log.created_at)}</div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{log.profiles?.full_name ?? "System"}</div>
                      <div className="tiny" style={{ color: "var(--ink-3)" }}>{log.profiles?.role ?? ""}</div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div className="row gap-2" style={{ alignItems: "center" }}>
                        {isSensitive
                          ? <ShieldAlert size={14} style={{ color: "var(--warn, #e53e3e)", flexShrink: 0 }} />
                          : <ShieldCheck size={14} style={{ color: "var(--good, #22c55e)", flexShrink: 0 }} />
                        }
                        <span className={`pill ${actionColor(log.action)}`} style={{ fontSize: 11 }}>
                          {log.action.replace(/_/g, " ")}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div className="small">{log.target_table ?? "—"}</div>
                      {log.target_id && (
                        <div className="tiny mono" style={{ color: "var(--ink-3)" }}>{log.target_id.substring(0, 8)}…</div>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px", maxWidth: 240 }}>
                      {log.metadata ? (
                        <div className="tiny" style={{ color: "var(--ink-3)", wordBreak: "break-all" }}>
                          {JSON.stringify(log.metadata).substring(0, 80)}
                          {JSON.stringify(log.metadata).length > 80 ? "…" : ""}
                        </div>
                      ) : (
                        <span className="tiny" style={{ color: "var(--ink-3)" }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="row" style={{ justifyContent: "center", gap: 8 }}>
          <button
            className="btn btn-glass btn-sm"
            disabled={page <= 1}
            onClick={() => goPage(page - 1)}
          >
            <ChevronLeft size={14} />
          </button>
          <span className="small" style={{ lineHeight: "32px" }}>
            Page {page} of {totalPages}
          </span>
          <button
            className="btn btn-glass btn-sm"
            disabled={page >= totalPages}
            onClick={() => goPage(page + 1)}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
