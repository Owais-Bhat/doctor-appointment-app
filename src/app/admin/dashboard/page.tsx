"use client";

import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { VisitRow, type DoctorVisit } from "@/components/doctor/VisitRow";
import { useAuth } from "@/context/AuthContext";
import { useApi } from "@/lib/use-api";
import { doctorName, formatFee, greeting } from "@/lib/format";

type List = { appointments: DoctorVisit[]; counts: { requests: number; today: number } };
type Stats = { stats: { rating: number; total_reviews: number; revenue_mtd: number; total_patients: number } | null };
type Availability = { availability: { is_active: boolean }[] };

export default function DoctorToday() {
  const { displayName } = useAuth();
  const today = useApi<List>("/api/doctor/appointments?scope=today");
  const requests = useApi<List>("/api/doctor/appointments?scope=requests");
  const stats = useApi<Stats>("/api/doctor/stats");
  const hours = useApi<Availability>("/api/doctor/availability");

  const visits = (today.data?.appointments ?? []).filter((v) => v.status !== "cancelled");
  const open = visits.filter((v) => v.status === "confirmed" || v.status === "pending");
  const done = visits.filter((v) => v.status === "completed" || v.status === "no_show");
  const waiting = requests.data?.counts.requests ?? 0;
  const noHours = !hours.loading && !hours.error && !(hours.data?.availability ?? []).some((a) => a.is_active);
  const s = stats.data?.stats;

  const lastName = displayName ? doctorName(displayName).split(" ").slice(-1)[0] : null;
  const dateLine = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

  const summary = today.loading
    ? "Loading today’s visits…"
    : visits.length === 0
      ? "No visits booked for today."
      : open.length === 0
        ? `All ${visits.length} of today’s visits are done.`
        : `${open.length} ${open.length === 1 ? "visit" : "visits"} left today${done.length ? `, ${done.length} done` : ""}.`;

  const refresh = () => {
    today.reload();
    requests.reload();
  };

  return (
    <div className="dr">
      <header className="dr-head">
        <div className="col gap-2">
          <h1 className="h-1">
            {greeting()}
            {lastName ? `, Dr. ${lastName}` : ""}
          </h1>
          <p className="body">
            {dateLine}. {summary}
          </p>
        </div>
      </header>

      {noHours && (
        <div className="dr-alert" role="status">
          <CalendarClock size={18} />
          <div className="col" style={{ gap: 2 }}>
            <strong>Patients can’t book you yet</strong>
            <span className="small">Set your weekly hours so open times appear in booking.</span>
          </div>
          <Link href="/admin/schedule" className="btn btn-primary btn-sm">
            Set hours
          </Link>
        </div>
      )}

      <div className="dr-grid">
        <section className="col gap-3" aria-labelledby="dr-today" style={{ minWidth: 0 }}>
          <h2 id="dr-today" className="h-4">Today’s visits</h2>
          {today.loading ? (
            <ul className="vrow-list" aria-busy="true">
              {[0, 1].map((i) => (
                <li key={i} className="bk-skeleton" style={{ minHeight: 96, borderRadius: 18 }} />
              ))}
            </ul>
          ) : today.error ? (
            <div className="bk-empty">
              <p className="h-4">Today’s visits could not be loaded</p>
              <button type="button" className="btn btn-ghost btn-sm" onClick={today.reload}>Try again</button>
            </div>
          ) : visits.length === 0 ? (
            <div className="bk-empty">
              <p className="h-4">A clear day</p>
              <p className="small">
                {waiting > 0 ? "Confirm waiting requests so patients know where they stand." : "New bookings for today will appear here."}
              </p>
            </div>
          ) : (
            <ul className="vrow-list">
              {visits.map((v) => (
                <VisitRow key={v.id} visit={v} onChanged={refresh} />
              ))}
            </ul>
          )}
        </section>

        <aside className="col gap-6">
          <section className="col gap-3" aria-labelledby="dr-req">
            <div className="row between">
              <h2 id="dr-req" className="h-4">
                Requests {waiting > 0 && <span className="dr-count">{waiting}</span>}
              </h2>
              {waiting > 0 && <Link href="/admin/appointments?tab=requests" className="db-link">See all</Link>}
            </div>
            {requests.loading ? (
              <div className="bk-skeleton" style={{ minHeight: 80, borderRadius: 18 }} />
            ) : waiting === 0 ? (
              <p className="small">You’re all caught up.</p>
            ) : (
              <ul className="vrow-list vrow-compact">
                {(requests.data?.appointments ?? []).slice(0, 3).map((v) => (
                  <VisitRow key={v.id} visit={v} showDate onChanged={refresh} />
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="dr-month">
            <h2 id="dr-month" className="h-4" style={{ marginBottom: 12 }}>At a glance</h2>
            <dl className="dr-stats">
              <div>
                <dt>Earned this month</dt>
                <dd>{s ? formatFee(s.revenue_mtd) : "—"}</dd>
              </div>
              <div>
                <dt>Patients</dt>
                <dd>{s?.total_patients ?? "—"}</dd>
              </div>
              <div>
                <dt>Rating</dt>
                <dd>{s && s.total_reviews > 0 ? `${Number(s.rating).toFixed(1)} (${s.total_reviews})` : "No reviews yet"}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
}
