"use client";

import { RankBars, StatTile, TrendChart } from "@/components/charts/Charts";
import { useApi } from "@/lib/use-api";
import { formatFee } from "@/lib/format";

type Response = {
  monthly: { month: string; appointments: number; revenue: number }[];
  userGrowth: { month: string; users: number }[];
  specialties: { name: string; count: number }[];
  statusBreakdown: { status: string; count: number }[];
  stats: {
    totalRevenue: number;
    totalAppointments: number;
    completedAppointments: number;
    verifiedDoctors: number;
    newUsersThisMonth: number;
    paidOnline?: number;
    paymentsEnabled?: boolean;
  };
};

const OUTCOME: Record<string, string> = {
  completed: "Completed",
  confirmed: "Confirmed, still to come",
  pending: "Waiting for the doctor",
  cancelled: "Cancelled",
  no_show: "Patient didn’t attend",
};

export default function SuperAdminAnalytics() {
  const { data, loading, error, reload } = useApi<Response>("/api/super-admin/analytics");
  const s = data?.stats;
  const ended = data ? data.statusBreakdown.filter((r) => ["completed", "cancelled", "no_show"].includes(r.status)).reduce((a, r) => a + r.count, 0) : 0;
  const completion = s && ended > 0 ? `${Math.round((s.completedAppointments / ended) * 100)}%` : "—";

  if (error) {
    return (
      <div className="bk-empty">
        <p className="h-4">Analytics couldn’t be loaded</p>
        <p className="small">{error}.</p>
        <button type="button" className="btn btn-ghost btn-sm" onClick={reload}>Try again</button>
      </div>
    );
  }

  return (
    <div className="dr">
      <header className="dr-head">
        <div className="col" style={{ gap: 4 }}>
          <h1 className="h-1">Analytics</h1>
          <p className="small">Visits, fees and sign-ups across MedFlow over the last six months.</p>
        </div>
      </header>

      <div className="an-tiles">
        <StatTile loading={loading} label="Visits" value={s ? s.totalAppointments.toLocaleString() : "—"} detail="booked in 6 months" />
        <StatTile
          loading={loading}
          label={s?.paymentsEnabled ? "Paid online" : "Consultation fees"}
          value={s ? formatFee(s.paymentsEnabled ? s.paidOnline ?? 0 : s.totalRevenue) : "—"}
          detail={s?.paymentsEnabled ? `${formatFee(s.totalRevenue)} from completed visits` : "from completed visits"}
        />
        <StatTile loading={loading} label="Completed" value={completion} detail="of visits that have ended" />
        <StatTile loading={loading} label="New users" value={s ? s.newUsersThisMonth.toLocaleString() : "—"} detail={s ? `this month · ${s.verifiedDoctors} verified doctors` : undefined} />
      </div>

      {loading || !data ? (
        <div className="an-grid" aria-busy="true">
          <div className="bk-skeleton" style={{ minHeight: 360, borderRadius: 22 }} />
          <div className="bk-skeleton" style={{ minHeight: 360, borderRadius: 22 }} />
        </div>
      ) : (
        <>
          <div className="an-grid">
            <TrendChart title="Visits per month" subtitle="All bookings on the platform" valueName="Visits" data={data.monthly.map((m) => ({ label: m.month, value: m.appointments }))} />
            <RankBars
              title="How visits ended"
              subtitle="Last six months"
              rows={data.statusBreakdown.filter((r) => r.count > 0).sort((a, b) => b.count - a.count).map((r) => ({ label: OUTCOME[r.status] ?? r.status, value: r.count }))}
              empty="No visits in the last six months."
            />
          </div>
          <div className="an-grid">
            <TrendChart title="New sign-ups per month" subtitle="Patients and doctors" valueName="Sign-ups" data={data.userGrowth.map((m) => ({ label: m.month, value: m.users }))} height={220} />
            <RankBars title="Doctors by specialty" subtitle="Top six" rows={data.specialties.map((r) => ({ label: r.name, value: r.count }))} empty="No doctors yet." />
          </div>
          <TrendChart
            title="Consultation fees per month"
            subtitle="Completed visits × each doctor’s fee"
            valueName="Fees"
            format={(v) => formatFee(v)}
            data={data.monthly.map((m) => ({ label: m.month, value: m.revenue }))}
            height={220}
          />
        </>
      )}
    </div>
  );
}
