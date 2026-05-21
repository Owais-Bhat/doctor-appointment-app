"use client";

import { ChevronRight, Filter, MapPin, Phone, Plus, Sparkles, TrendingUp, Video } from "lucide-react";
import { MedFlowVoiceAssistant } from "@/components/MedFlowVoiceAssistant";

const kpis = [
  { label: "Today's appointments", value: "18", detail: "+3 vs avg" },
  { label: "Patient satisfaction", value: "4.9", detail: "NPS 72" },
  { label: "Avg. wait time", value: "8m", detail: "-2m" },
  { label: "Revenue MTD", value: "$24.8k", detail: "+12%" },
];

const todaySched = [
  { time: "09:00", patient: "Maya Rivera", reason: "Follow-up · Echo", duration: 30, mode: "In-person", status: "done" },
  { time: "09:30", patient: "David Klein", reason: "New patient · Chest pain", duration: 45, mode: "In-person", status: "done" },
  { time: "10:15", patient: "Priya Shah", reason: "Lab review", duration: 30, mode: "Voice", status: "now" },
  { time: "11:00", patient: "James Okonkwo", reason: "Pre-op consult", duration: 30, mode: "Video", status: "next" },
  { time: "13:30", patient: "Sara Anders", reason: "Follow-up · 6mo", duration: 30, mode: "In-person", status: "upcoming" },
  { time: "14:30", patient: "Alex Rivera", reason: "New patient · Palpitations", duration: 45, mode: "Voice", status: "upcoming" },
  { time: "15:30", patient: "Maria Conte", reason: "Refill · Atorvastatin", duration: 15, mode: "Voice", status: "upcoming" },
];

export default function DoctorDashboard() {
  return (
    <div className="fade-enter col gap-7">
      <div className="row between wrap gap-4">
        <div className="col" style={{ gap: 6 }}>
          <div className="eyebrow">Doctor&apos;s view</div>
          <h1 className="h-1">
            Good morning, <span className="hero-italic" style={{ color: "var(--accent)" }}>Dr. Jenkins</span>.
          </h1>
          <p className="body">7 appointments left today. Your next patient joins in 12 minutes.</p>
        </div>
        <div className="row gap-3">
          <button className="btn btn-ghost"><Filter size={14} /> Filter</button>
          <button className="btn btn-primary"><Plus size={14} /> Add slot</button>
        </div>
      </div>

      <div className="bento" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        {kpis.map((kpi, index) => (
          <div key={kpi.label} className="glass cell stat">
            <div className="eyebrow" style={{ marginBottom: 10 }}>{kpi.label}</div>
            <div className="row between" style={{ alignItems: "baseline" }}>
              <div className="val tnum">{kpi.value}</div>
              <span className="delta up"><TrendingUp size={13} />{kpi.detail}</span>
            </div>
            <Spark index={index} />
          </div>
        ))}
      </div>

      <div className="admin-grid" style={{ display: "grid", gridTemplateColumns: "1.45fr .9fr", gap: 20, alignItems: "start" }}>
        <div className="glass" style={{ padding: 24 }}>
          <div className="row between" style={{ marginBottom: 18 }}>
            <div className="col" style={{ gap: 4 }}>
              <div className="eyebrow">Schedule</div>
              <div className="h-3">Tuesday, May 19</div>
            </div>
            <div className="tabs">
              <button className="tab active">Today</button>
              <button className="tab">Tomorrow</button>
              <button className="tab">Week</button>
            </div>
          </div>

          <div className="col gap-2">
            {todaySched.map((item, index) => (
              <div
                key={`${item.time}-${item.patient}`}
                className="row gap-4"
                style={{
                  padding: "12px 14px",
                  borderRadius: 14,
                  background: item.status === "now" ? "color-mix(in oklab, var(--accent) 10%, transparent)" : "transparent",
                  border: item.status === "now" ? "1px solid color-mix(in oklab, var(--accent) 24%, transparent)" : "1px solid var(--line)",
                  alignItems: "center",
                }}
              >
                <div className="col" style={{ gap: 2, minWidth: 60 }}>
                  <div className="tnum" style={{ fontWeight: 700, fontSize: 15 }}>{item.time}</div>
                  <div className="tiny">{item.duration}m</div>
                </div>
                <div className="vr" />
                <Headshot name={item.patient} hue={(index * 55 + 30) % 360} size={36} />
                <div className="grow col" style={{ gap: 2 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{item.patient}</div>
                  <div className="tiny">{item.reason}</div>
                </div>
                <span className="pill">
                  {item.mode === "Video" ? <Video size={11} /> : item.mode === "Voice" ? <Phone size={11} /> : <MapPin size={11} />}
                  {item.mode}
                </span>
                {item.status === "done" && <span className="pill good">Done</span>}
                {item.status === "now" && <button className="btn btn-primary btn-sm"><Phone size={13} /> Join</button>}
                {item.status === "next" && <span className="pill warn">Next</span>}
                {item.status === "upcoming" && <ChevronRight size={16} style={{ color: "var(--ink-3)" }} />}
              </div>
            ))}
          </div>
        </div>

        <div className="col gap-4">
          <MedFlowVoiceAssistant />

          <div className="glass" style={{ padding: 22 }}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>Patient messages</div>
            <div className="col gap-3">
              {[
                ["Maya R.", "Quick question about the new dose", "2m", true],
                ["David K.", "Lab results are uploaded", "14m", true],
                ["Priya S.", "Confirming tomorrow at 1pm", "1h", false],
              ].map(([name, message, time, unread], index) => (
                <div key={String(name)} className="row gap-3">
                  <Headshot name={String(name)} hue={(index * 70 + 20) % 360} size={36} />
                  <div className="grow col" style={{ gap: 2 }}>
                    <div className="row between">
                      <b style={{ fontSize: 14 }}>{name}</b>
                      <span className="tiny">{time}</span>
                    </div>
                    <div className="small" style={{ fontSize: 13, opacity: unread ? 1 : 0.6 }}>{message}</div>
                  </div>
                  {unread && <span className="dot" style={{ background: "var(--accent)", width: 8, height: 8 }} />}
                </div>
              ))}
            </div>
          </div>

          <div className="glass" style={{ padding: 22 }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>AI suggestions</div>
            <div className="row gap-3">
              <div style={{ color: "var(--accent)" }}><Sparkles size={20} /></div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Two follow-ups pending</div>
                <div className="small" style={{ fontSize: 13 }}>Maya R. and Sara A. haven&apos;t booked their 3-month checks. Want me to draft outreach?</div>
                <div className="row gap-2" style={{ marginTop: 10 }}>
                  <button className="btn btn-primary btn-sm">Draft</button>
                  <button className="btn btn-ghost btn-sm">Later</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Headshot({ name, hue, size }: { name: string; hue: number; size: number }) {
  const initials = name.split(" ").map((part) => part[0]).slice(0, 2).join("");
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `linear-gradient(135deg, hsl(${hue} 65% 65%), hsl(${(hue + 40) % 360} 60% 40%))`,
        display: "grid",
        placeItems: "center",
        color: "#fff",
        fontWeight: 600,
        fontSize: size * 0.32,
        boxShadow: "inset 0 -10px 30px rgba(0,0,0,.18), inset 0 6px 14px rgba(255,255,255,.18)",
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

function Spark({ index }: { index: number }) {
  const data = [3, 4, 3, 5, 4, 6, 5, 7, 6, 8].map((x) => x + index);
  const max = Math.max(...data);
  const min = Math.min(...data);
  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 32 - 6 - ((value - min) / (max - min || 1)) * 20;
    return [x, y];
  });
  const path = points.map((point, i) => `${i ? "L" : "M"}${point[0].toFixed(1)},${point[1].toFixed(1)}`).join(" ");
  return (
    <svg className="chart" viewBox="0 0 100 32" preserveAspectRatio="none" style={{ height: 32 }}>
      <path d={`${path} L100,32 L0,32 Z`} fill="var(--accent)" opacity="0.14" />
      <path d={path} fill="none" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
