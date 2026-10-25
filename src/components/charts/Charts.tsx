"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

/** A headline number: label, value, one line of context. */
export function StatTile({ label, value, detail, loading }: { label: string; value: string; detail?: string; loading?: boolean }) {
  return (
    <div className="an-tile">
      <span className="an-tile-label">{label}</span>
      <span className="an-tile-value">{loading ? <span className="an-tile-skel" aria-hidden="true" /> : value}</span>
      {detail && <span className="an-tile-detail">{detail}</span>}
    </div>
  );
}

type Point = { label: string; value: number };

/**
 * One series over time: 2px line, soft fill, hairline grid, crosshair tooltip.
 * Includes a visually hidden table so the numbers are available without the chart.
 */
export function TrendChart({
  title,
  subtitle,
  data,
  format = (v) => v.toLocaleString(),
  valueName,
  height = 240,
}: {
  title: string;
  subtitle?: string;
  data: Point[];
  format?: (v: number) => string;
  valueName: string;
  height?: number;
}) {
  const id = useId().replace(/:/g, "");
  const reduce = useReducedMotion();
  const last = data[data.length - 1];
  return (
    <figure className="an-card">
      <figcaption className="an-head">
        <span className="an-title">{title}</span>
        {subtitle && <span className="an-sub">{subtitle}</span>}
      </figcaption>
      {last && <p className="an-hero">{format(last.value)} <span>in {last.label} so far</span></p>}
      <div style={{ height }} aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`f${id}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.18} />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--line)" vertical={false} />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "var(--ink-3)", fontSize: 12 }} dy={6} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--ink-3)", fontSize: 12 }} tickFormatter={(v) => format(Number(v))} width={64} allowDecimals={false} />
            <Tooltip
              cursor={{ stroke: "var(--ink-3)", strokeWidth: 1 }}
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <div className="an-tip">
                    <span className="an-tip-label">{label}</span>
                    <span><i className="an-swatch" /> {valueName} <b>{format(Number(payload[0].value))}</b></span>
                  </div>
                ) : null
              }
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--accent)"
              strokeWidth={2}
              fill={`url(#f${id})`}
              activeDot={{ r: 5, stroke: "var(--bg)", strokeWidth: 2, fill: "var(--accent)" }}
              isAnimationActive={!reduce}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>{title}</caption>
        <thead><tr><th>Month</th><th>{valueName}</th></tr></thead>
        <tbody>{data.map((d) => <tr key={d.label}><td>{d.label}</td><td>{format(d.value)}</td></tr>)}</tbody>
      </table>
    </figure>
  );
}

/** Ranked rows with a thin bar each: one series, one colour, numbers as text. */
export function RankBars({ title, subtitle, rows, empty = "Nothing yet" }: { title: string; subtitle?: string; rows: { label: string; value: number }[]; empty?: string }) {
  const reduce = useReducedMotion();
  const total = rows.reduce((s, r) => s + r.value, 0);
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <figure className="an-card">
      <figcaption className="an-head">
        <span className="an-title">{title}</span>
        {subtitle && <span className="an-sub">{subtitle}</span>}
      </figcaption>
      {total === 0 ? (
        <p className="small">{empty}</p>
      ) : (
        <ul className="an-rank">
          {rows.map((r, i) => (
            <li key={r.label}>
              <span className="an-rank-label">{r.label}</span>
              <span className="an-rank-val">{r.value.toLocaleString()} <span>{Math.round((r.value / total) * 100)}%</span></span>
              <span className="an-rank-track" aria-hidden="true">
                <motion.span
                  className="an-rank-bar"
                  initial={reduce ? false : { width: 0 }}
                  whileInView={{ width: `${(r.value / max) * 100}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.05, ease: [0.2, 0.8, 0.2, 1] }}
                  style={reduce ? { width: `${(r.value / max) * 100}%` } : undefined}
                />
              </span>
            </li>
          ))}
        </ul>
      )}
    </figure>
  );
}
