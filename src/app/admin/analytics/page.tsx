"use client";

import { RankBars, StatTile, TrendChart } from "@/components/charts/Charts";
import { useApi } from "@/lib/use-api";
import { formatFee } from "@/lib/format";

type Response = {
  monthly: { month: string; visits: number; revenue: number }[];
  stats: { totalVisits: number; totalRevenue: number; uniquePatients: number; rating: number; totalReviews: number; completedVisits: number };
  statusBreakdown: { status: string; count: number }[];
};

const OUTCOME: Record<string, string> = {
  completed: "Completed",
  confirmed: "Confirmed, still to come",
  pending: "Waiting for you to confirm",
  cancelled: "Cancelled",
  no_show: "Patient didn’t attend",
};

export default function DoctorAnalytics() {
  const { data, loading, error, reload } = useApi<Response>("/api/doctor/analytics");
  const s = data?.stats;
  const ended = data ? data.statusBreakdown.filter((r) => ["completed", "cancelled", "no_show"].includes(r.status)).reduce((a, r) => a + r.count, 0) : 0;
  const completion = s && ended > 0 ? Math.round((s.completedVisits / ended) * 100) : null;

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
          <p className="small">Your practice over the last six months.</p>
        </div>
      </header>

      <div className="an-tiles">
        <StatTile loading={loading} label="Visits" value={s ? s.totalVisits.toLocaleString() : "—"} detail="booked in 6 months" />
        <StatTile loading={loading} label="Earned" value={s ? formatFee(s.totalRevenue) : "—"} detail={s ? `from ${s.completedVisits} completed visits` : undefined} />
        <StatTile loading={loading} label="Patients" value={s ? s.uniquePatients.toLocaleString() : "—"} detail="different people" />
        <StatTile
          loading={loading}
          label={completion !== null ? "Completed" : "Rating"}
          value={completion !== null ? `${completion}%` : s && s.rating > 0 ? s.rating.toFixed(1) : "—"}
          detail={completion !== null ? "of visits that have ended" : s ? `${s.totalReviews} reviews` : undefined}
        />
      </div>

      {loading || !data ? (
        <div className="an-grid" aria-busy="true">
          <div className="bk-skeleton" style={{ minHeight: 360, borderRadius: 22 }} />
          <div className="bk-skeleton" style={{ minHeight: 360, borderRadius: 22 }} />
        </div>
      ) : (
        <>
          <div className="an-grid">
            <TrendChart
              title="Visits per month"
              subtitle="All bookings, whatever happened to them"
              valueName="Visits"
              data={data.monthly.map((m) => ({ label: m.month, value: m.visits }))}
            />
            <RankBars
              title="How visits ended"
              subtitle="Last six months"
              rows={data.statusBreakdown
                .filter((r) => r.count > 0)
                .sort((a, b) => b.count - a.count)
                .map((r) => ({ label: OUTCOME[r.status] ?? r.status, value: r.count }))}
              empty="No visits in the last six months."
            />
          </div>
          <TrendChart
            title="Earnings per month"
            subtitle="Completed visits × your consultation fee"
            valueName="Earned"
            format={(v) => formatFee(v)}
            data={data.monthly.map((m) => ({ label: m.month, value: m.revenue }))}
            height={220}
          />
        </>
      )}
    </div>
  );
}
