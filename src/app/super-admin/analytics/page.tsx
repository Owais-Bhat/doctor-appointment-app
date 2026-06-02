"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAuth } from "@/context/AuthContext";

type MonthRow = { month: string; appointments: number; revenue: number };
type UserGrowthRow = { month: string; users: number };
type SpecialtyRow = { name: string; count: number };
type StatusRow = { status: string; count: number };
type Stats = {
  totalRevenue: number;
  totalAppointments: number;
  completedAppointments: number;
  verifiedDoctors: number;
  newUsersThisMonth: number;
};

const STATUS_COLOR: Record<string, string> = {
  completed: "#22c55e",
  confirmed: "#3b82f6",
  pending: "#f59e0b",
  cancelled: "#ef4444",
};

const SPECIALTY_COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4", "#f59e0b", "#22c55e", "#ef4444"];

export default function SuperAdminAnalytics() {
  const { user, getToken } = useAuth();
  const [monthly, setMonthly] = useState<MonthRow[]>([]);
  const [userGrowth, setUserGrowth] = useState<UserGrowthRow[]>([]);
  const [specialties, setSpecialties] = useState<SpecialtyRow[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<StatusRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getToken().then(async token => {
      const res = await fetch("/api/super-admin/analytics", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setMonthly(data.monthly ?? []);
      setUserGrowth(data.userGrowth ?? []);
      setSpecialties(data.specialties ?? []);
      setStatusBreakdown(data.statusBreakdown ?? []);
      setStats(data.stats ?? null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  const kpis = stats ? [
    { label: "Revenue (6mo)", value: `$${stats.totalRevenue.toLocaleString()}`, detail: "completed" },
    { label: "Appointments", value: String(stats.totalAppointments), detail: "total" },
    { label: "Completion rate", value: stats.totalAppointments > 0 ? `${Math.round((stats.completedAppointments / stats.totalAppointments) * 100)}%` : "—", detail: "of visits" },
    { label: "New users", value: String(stats.newUsersThisMonth), detail: "this month" },
  ] : [
    { label: "Revenue (6mo)", value: "—", detail: "" },
    { label: "Appointments", value: "—", detail: "" },
    { label: "Completion rate", value: "—", detail: "" },
    { label: "New users", value: "—", detail: "" },
  ];

  return (
    <div className="fade-enter col gap-7">
      <div className="col" style={{ gap: 6 }}>
        <div className="eyebrow">Platform analytics</div>
        <h1 className="h-1">BI and forecasting</h1>
        <p className="body">Platform-wide revenue, user growth, specialties, and operational benchmarks.</p>
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

      <div className="admin-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div className="glass" style={{ padding: 24 }}>
          <div className="eyebrow" style={{ marginBottom: 4 }}>Monthly appointments</div>
          <div className="h-3" style={{ marginBottom: 18 }}>Platform visit volume</div>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly}>
                <defs>
                  <linearGradient id="apptFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent, #3b82f6)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--accent, #3b82f6)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--line, #e5edf5)" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "var(--ink-3, #64748b)", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--ink-3, #64748b)", fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid var(--line, #e5edf5)", fontSize: 13 }} />
                <Area type="monotone" dataKey="appointments" stroke="var(--accent, #3b82f6)" strokeWidth={2.5} fill="url(#apptFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass" style={{ padding: 24 }}>
          <div className="eyebrow" style={{ marginBottom: 4 }}>User growth</div>
          <div className="h-3" style={{ marginBottom: 18 }}>New registrations per month</div>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userGrowth}>
                <defs>
                  <linearGradient id="userFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--line, #e5edf5)" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "var(--ink-3, #64748b)", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--ink-3, #64748b)", fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid var(--line, #e5edf5)", fontSize: 13 }} />
                <Area type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#userFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="admin-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div className="glass" style={{ padding: 24 }}>
          <div className="eyebrow" style={{ marginBottom: 4 }}>Specialty distribution</div>
          <div className="h-3" style={{ marginBottom: 18 }}>Doctors by specialty</div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={specialties}>
                <CartesianGrid stroke="var(--line, #e5edf5)" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--ink-3, #64748b)", fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--ink-3, #64748b)", fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid var(--line, #e5edf5)", fontSize: 13 }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {specialties.map((_, i) => (
                    <Cell key={i} fill={SPECIALTY_COLORS[i % SPECIALTY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass" style={{ padding: 24 }}>
          <div className="eyebrow" style={{ marginBottom: 4 }}>Status breakdown</div>
          <div className="h-3" style={{ marginBottom: 18 }}>All appointments by status</div>
          <div style={{ height: 220 }}>
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
    </div>
  );
}
