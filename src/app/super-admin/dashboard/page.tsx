"use client";

import Link from "next/link";
import { DoctorReviewRow, type AdminDoctor } from "@/components/admin/DoctorReviewRow";
import { useApi } from "@/lib/use-api";
import { auditLabel, auditTone, timeAgo } from "@/lib/audit-labels";
import { cn } from "@/lib/utils";

type Stats = {
  stats: {
    total_users: number;
    new_users_this_month: number;
    suspended_users: number;
    verified_doctors: number;
    pending_doctors: number;
    total_appointments: number;
    appointments_this_month: number;
  };
};
type Log = {
  id: string;
  action: string;
  created_at: string;
  profiles: { full_name: string; role: string } | null;
};

export default function AdminOverview() {
  const stats = useApi<Stats>("/api/super-admin/stats");
  const doctors = useApi<{ doctors: AdminDoctor[] }>("/api/super-admin/doctors");
  const logs = useApi<{ logs: Log[] }>("/api/super-admin/audit-logs?page=1&limit=8");

  const s = stats.data?.stats;
  const waiting = (doctors.data?.doctors ?? []).filter((d) => !d.is_verified && d.profiles?.is_active !== false);
  const refresh = () => {
    stats.reload();
    doctors.reload();
    logs.reload();
  };

  const tiles = [
    { label: "People on MedFlow", value: s?.total_users, sub: s ? `${s.new_users_this_month} joined this month` : "" },
    { label: "Verified doctors", value: s?.verified_doctors, sub: s ? `${s.pending_doctors} not verified` : "" },
    { label: "Visits this month", value: s?.appointments_this_month, sub: s ? `${s.total_appointments.toLocaleString()} all time` : "" },
    { label: "Suspended accounts", value: s?.suspended_users, sub: "Can’t sign in to the app" },
  ];

  return (
    <div className="dr">
      <header className="dr-head">
        <div className="col gap-2">
          <h1 className="h-1">Platform overview</h1>
          <p className="body">
            {doctors.loading ? "Checking for doctors to verify…" : waiting.length > 0
              ? `${waiting.length} ${waiting.length === 1 ? "doctor is" : "doctors are"} waiting for verification.`
              : "No doctors are waiting for verification."}
          </p>
        </div>
      </header>

      <dl className="ad-tiles">
        {tiles.map((t) => (
          <div key={t.label} className={cn(stats.loading && "bk-skeleton")}>
            <dt>{t.label}</dt>
            <dd>{t.value !== undefined ? t.value.toLocaleString() : "—"}</dd>
            <span className="tiny">{t.sub}</span>
          </div>
        ))}
      </dl>

      <div className="dr-grid">
        <section className="col gap-3" aria-labelledby="ad-wait" style={{ minWidth: 0 }}>
          <div className="row between">
            <h2 id="ad-wait" className="h-4">Waiting for verification</h2>
            <Link href="/super-admin/doctors" className="db-link">All doctors</Link>
          </div>
          {doctors.loading ? (
            <div className="bk-skeleton" style={{ minHeight: 120, borderRadius: 18 }} />
          ) : doctors.error ? (
            <div className="bk-empty">
              <p className="h-4">Doctors could not be loaded</p>
              <button type="button" className="btn btn-ghost btn-sm" onClick={doctors.reload}>Try again</button>
            </div>
          ) : waiting.length === 0 ? (
            <div className="bk-empty">
              <p className="h-4">All caught up</p>
              <p className="small">To add a doctor, find their account on the Users page and choose “Make doctor”.</p>
              <Link href="/super-admin/users" className="btn btn-ghost btn-sm">Go to users</Link>
            </div>
          ) : (
            <ul className="ad-list">
              {waiting.map((d) => (
                <DoctorReviewRow key={d.id} doctor={d} onChanged={refresh} />
              ))}
            </ul>
          )}
        </section>

        <section className="col gap-3" aria-labelledby="ad-activity">
          <div className="row between">
            <h2 id="ad-activity" className="h-4">Recent activity</h2>
            <Link href="/super-admin/audit-logs" className="db-link">Audit log</Link>
          </div>
          {logs.loading ? (
            <div className="bk-skeleton" style={{ minHeight: 160, borderRadius: 18 }} />
          ) : (logs.data?.logs ?? []).length === 0 ? (
            <p className="small">Actions like verifying doctors and confirming visits will appear here.</p>
          ) : (
            <ul className="ad-feed">
              {(logs.data?.logs ?? []).map((l) => (
                <li key={l.id}>
                  <span className={cn("ad-dot", auditTone(l.action))} aria-hidden="true" />
                  <span className="small">
                    <strong>{l.profiles?.full_name ?? "Someone"}</strong> {auditLabel(l.action)}
                  </span>
                  <span className="tiny">{timeAgo(l.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
