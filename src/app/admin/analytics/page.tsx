"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3, Brain, FileCheck2, LineChart, TrendingUp, WalletCards } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { insights } from "@/lib/medflow-data";

const revenueData = [
  { month: "Jan", revenue: 31800, visits: 218 },
  { month: "Feb", revenue: 34200, visits: 241 },
  { month: "Mar", revenue: 37100, visits: 263 },
  { month: "Apr", revenue: 39250, visits: 286 },
  { month: "May", revenue: 42800, visits: 312 },
  { month: "Jun", revenue: 46100, visits: 334 },
];

const qualityData = [
  { metric: "CQM", score: 94 },
  { metric: "HEDIS", score: 91 },
  { metric: "Access", score: 97 },
  { metric: "Claims", score: 94 },
  { metric: "Safety", score: 99 },
];

export default function DoctorAnalytics() {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-blue-700">Business intelligence</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-950 md:text-3xl">Enterprise analytics</h1>
        <p className="mt-2 text-sm text-slate-600">Revenue cycle, forecasting, operational benchmarks, quality measures, and AI outcomes.</p>
      </div>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {insights.map((insight) => {
          const Icon = insight.icon;
          return (
            <div key={insight.label} className="med-card p-4">
              <Icon size={18} className="text-blue-700" />
              <p className="mt-3 text-2xl font-bold text-slate-950">{insight.value}</p>
              <p className="text-sm font-semibold text-slate-800">{insight.label}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{insight.detail}</p>
            </div>
          );
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="med-card p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Revenue and visit forecast</h2>
              <p className="text-sm text-slate-500">Projected performance from scheduling, claims, and visit volume.</p>
            </div>
            <LineChart size={20} className="text-blue-700" />
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#1463ff" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#1463ff" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e5edf5" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #dfe7ef" }} />
                <Area type="monotone" dataKey="revenue" stroke="#1463ff" strokeWidth={3} fill="url(#revenueFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="med-card p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Quality benchmark</h2>
              <p className="text-sm text-slate-500">Peer comparison and compliance indicators.</p>
            </div>
            <BarChart3 size={20} className="text-blue-700" />
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={qualityData}>
                <CartesianGrid stroke="#e5edf5" vertical={false} />
                <XAxis dataKey="metric" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #dfe7ef" }} />
                <Bar dataKey="score" fill="#0f766e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <AnalyticsPanel icon={WalletCards} title="Revenue cycle" detail="EDI eligibility, claims validation, remittance tracking, denial queue, and patient responsibility estimation are represented in the analytics layer." />
        <AnalyticsPanel icon={Brain} title="Clinical AI" detail="No-show prediction, schedule optimization, clinical risk scoring, and note intelligence feed the operational views." />
        <AnalyticsPanel icon={FileCheck2} title="Quality reporting" detail="CQM, HEDIS, registry, audit, and compliance metrics are organized for enterprise reporting." />
      </section>
    </div>
  );
}

function AnalyticsPanel({ icon: Icon, title, detail }: { icon: LucideIcon; title: string; detail: string }) {
  return (
    <div className="med-card p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-blue-700">
        <Icon size={19} />
      </div>
      <h2 className="mt-4 text-lg font-bold text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
      <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-emerald-700">
        <TrendingUp size={16} /> Production module ready
      </div>
    </div>
  );
}
