"use client";

import { formatFee } from "@/lib/format";
import { useEffect, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAuth } from "@/context/AuthContext";

type MonthRow = { month: string; visits: number; revenue: number };
type StatusRow = { status: string; count: number };
type Stats = {
  totalVisits: number;
  totalRevenue: number;
  uniquePatients: number;
  rating: number;
  totalReviews: number;
  completedVisits: number;
};

const STATUS_COLOR: Record<string, string> = {
  completed: "#22c55e",
  confirmed: "#3b82f6",
  pending: "#f59e0b",
  cancelled: "#ef4444",
};

export default function DoctorAnalytics() {
  const { user, getToken } = useAuth();
  const [monthly, setMonthly] = useState<MonthRow[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<StatusRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getToken().then(async token => {
      const res = await fetch("/api/doctor/analytics", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setMonthly(data.monthly ?? []);
      setStatusBreakdown(data.statusBreakdown ?? []);
      setStats(data.stats ?? null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  const kpis = stats ? [
    { label: "Total visits", value: String(stats.totalVisits), detail: "6 months" },
    { label: "Revenue", value: formatFee(stats.totalRevenue), detail: "completed" },
    { label: "Patients", value: String(stats.uniquePatients), detail: "unique" },
    { label: "Rating", value: stats.rating > 0 ? stats.rating.toFixed(1) : "—", detail: `${stats.totalReviews} reviews` },
  ] : [
    { label: "Total visits", value: "—", detail: "" },
    { label: "Revenue", value: "—", detail: "" },
    { label: "Patients", value: "—", detail: "" },
    { label: "Rating", value: "—", detail: "" },
  ];

  return (
    <div className="fade-enter col gap-7">
      <div className="col">
        <div className="eyebrow">Business intelligence</div>
        <h1 className="h-1">Analytics</h1>
        <p className="body">Visit volume, revenue cycle, patient outcomes, and quality measures.</p>
      </div>

      <div className="bento" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        {kpis.map(kpi => (
          <div key={kpi.label} className="glass cell stat">
            <div className="eyebrow" style={{ marginBottom: 10 }}>{kpi.label}</div>
            <div className="row between" style={{ alignItems: "baseline" }}>
              <div className="val tnum">{loading ? "…" : kpi.value}</div>
              {kpi.detail && <span className="tiny" style={{ color: "var(--ink-3)" }}>{kpi.detail}</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="admin-grid" style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 20 }}>
        <div className="glass" style={{ padding: 24 }}>
          <div className="eyebrow" style={{ marginBottom: 4 }}>Monthly visits</div>
          <div className="h-3" style={{ marginBottom: 18 }}>Visit volume over 6 months</div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly}>
                <defs>
                  <linearGradient id="visitFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent, #3b82f6)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--accent, #3b82f6)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--line, #e5edf5)" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "var(--ink-3, #64748b)", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--ink-3, #64748b)", fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid var(--line, #e5edf5)", fontSize: 13 }} />
                <Area type="monotone" dataKey="visits" stroke="var(--accent, #3b82f6)" strokeWidth={2.5} fill="url(#visitFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass" style={{ padding: 24 }}>
          <div className="eyebrow" style={{ marginBottom: 4 }}>Status breakdown</div>
          <div className="h-3" style={{ marginBottom: 18 }}>Appointments by status</div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusBreakdown} layout="vertical">
                <CartesianGrid stroke="var(--line, #e5edf5)" horizontal={false} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "var(--ink-3, #64748b)", fontSize: 12 }} />
                <YAxis dataKey="status" type="category" axisLine={false} tickLine={false} tick={{ fill: "var(--ink-3, #64748b)", fontSize: 12 }} width={72} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid var(--line, #e5edf5)", fontSize: 13 }} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {statusBreakdown.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLOR[entry.status] ?? "#94a3b8"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="glass" style={{ padding: 24 }}>
        <div className="eyebrow" style={{ marginBottom: 4 }}>Monthly revenue</div>
        <div className="h-3" style={{ marginBottom: 18 }}>Completed consultation revenue</div>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthly}>
              <defs>
                <linearGradient id="revFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--line, #e5edf5)" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "var(--ink-3, #64748b)", fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--ink-3, #64748b)", fontSize: 12 }} tickFormatter={v => formatFee(v)} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid var(--line, #e5edf5)", fontSize: 13 }} formatter={(v) => [formatFee(Number(v)), "Revenue"]} />
              <Area type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2.5} fill="url(#revFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
