"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { VisitRow, type DoctorVisit } from "@/components/doctor/VisitRow";
import { useApi } from "@/lib/use-api";
import { formatDay } from "@/lib/format";
import { cn } from "@/lib/utils";

type Scope = "requests" | "upcoming" | "past";
type Response = { appointments: DoctorVisit[]; counts: { requests: number; today: number } };

const TABS: { scope: Scope; label: string; empty: { title: string; body: string } }[] = [
  {
    scope: "requests",
    label: "Requests",
    empty: { title: "No requests waiting", body: "New booking requests appear here for you to confirm." },
  },
  {
    scope: "upcoming",
    label: "Upcoming",
    empty: { title: "Nothing confirmed yet", body: "Confirmed visits from today onwards will be listed here." },
  },
  {
    scope: "past",
    label: "Past",
    empty: { title: "No past visits", body: "Completed, missed and cancelled visits will show up here." },
  },
];

function groupByDay(visits: DoctorVisit[]) {
  const groups = new Map<string, DoctorVisit[]>();
  for (const v of visits) {
    const list = groups.get(v.appointment_date) ?? [];
    list.push(v);
    groups.set(v.appointment_date, list);
  }
  return [...groups.entries()];
}

function Appointments() {
  const router = useRouter();
  const params = useSearchParams();
  const scope = (TABS.some((t) => t.scope === params.get("tab")) ? params.get("tab") : "requests") as Scope;
  const tab = TABS.find((t) => t.scope === scope)!;

  const { data, loading, error, reload } = useApi<Response>(`/api/doctor/appointments?scope=${scope}`);
  const groups = useMemo(() => groupByDay(data?.appointments ?? []), [data]);

  return (
    <div className="dr">
      <header className="dr-head">
        <h1 className="h-1">Appointments</h1>
        <nav className="dr-tabs" aria-label="Appointment lists">
          {TABS.map((t) => (
            <Link
              key={t.scope}
              href={`/admin/appointments?tab=${t.scope}`}
              className={cn("dr-tab", t.scope === scope && "on")}
              aria-current={t.scope === scope ? "page" : undefined}
              replace
            >
              {t.label}
              {t.scope === "requests" && !!data?.counts.requests && <span className="dr-count">{data.counts.requests}</span>}
            </Link>
          ))}
        </nav>
      </header>

      {loading ? (
        <ul className="vrow-list" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <li key={i} className="bk-skeleton" style={{ minHeight: 96, borderRadius: 18 }} />
          ))}
        </ul>
      ) : error ? (
        <div className="bk-empty">
          <p className="h-4">Appointments could not be loaded</p>
          <p className="small">{error}.</p>
          <button type="button" className="btn btn-ghost btn-sm" onClick={reload}>
            Try again
          </button>
        </div>
      ) : groups.length === 0 ? (
        <div className="bk-empty">
          <p className="h-4">{tab.empty.title}</p>
          <p className="small">{tab.empty.body}</p>
          {scope === "requests" && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => router.replace("/admin/appointments?tab=upcoming")}>
              See upcoming visits
            </button>
          )}
        </div>
      ) : (
        <div className="col gap-6">
          {groups.map(([date, visits]) => (
            <section key={date} className="col gap-2" aria-label={formatDay(date)}>
              <h2 className="dr-day">
                {formatDay(date)}
                <span className="tiny"> · {visits.length} {visits.length === 1 ? "visit" : "visits"}</span>
              </h2>
              <ul className="vrow-list">
                {visits.map((v) => (
                  <VisitRow key={v.id} visit={v} onChanged={reload} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AppointmentsPage() {
  return (
    <Suspense>
      <Appointments />
    </Suspense>
  );
}
