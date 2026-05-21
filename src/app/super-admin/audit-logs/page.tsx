"use client";

import { FileText, ShieldAlert, ShieldCheck } from "lucide-react";

export default function AuditLogsPage() {
  const logs = ["PHI access · Maya Rivera · SUCCESS", "Claims export · Jenkins Cardiology · SUCCESS", "SSO login · Avery Ops · SUCCESS", "Rate limit · API v1 · BLOCKED"];
  return (
    <div className="fade-enter col gap-7">
      <div><div className="eyebrow">Compliance</div><h1 className="h-1">Audit logs</h1><p className="body">HIPAA, GDPR, CCPA, and enterprise security evidence.</p></div>
      <div className="glass" style={{ padding: 24 }}>
        <div className="col gap-3">{logs.map((log, index) => <div key={log} className="row gap-4" style={{ padding: 14, borderRadius: 14, border: "1px solid var(--line)" }}><span className="icon-btn" style={{ color: index === 3 ? "var(--warn)" : "var(--good)" }}>{index === 3 ? <ShieldAlert size={15} /> : <ShieldCheck size={15} />}</span><div className="grow" style={{ fontWeight: 700 }}>{log}</div><span className="tiny mono">req_{1000 + index}</span><FileText size={15} style={{ color: "var(--ink-3)" }} /></div>)}</div>
      </div>
    </div>
  );
}
