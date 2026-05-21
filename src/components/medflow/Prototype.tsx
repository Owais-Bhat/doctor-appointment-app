"use client";

import {
  Activity,
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  CreditCard,
  FileText,
  Globe2,
  HeartPulse,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users,
  Video,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const patients = [
  { name: "Maya Rivera", age: 34, sex: "F", last: "3d ago", next: "May 26", visits: 7, tag: "Echo follow-up", hue: 30, bp: "118/76", risk: "low" },
  { name: "David Klein", age: 58, sex: "M", last: "Today", next: "Jun 02", visits: 12, tag: "Hypertension", hue: 210, bp: "142/92", risk: "med" },
  { name: "Priya Shah", age: 42, sex: "F", last: "1w ago", next: "May 21", visits: 3, tag: "Labs pending", hue: 320, bp: "124/80", risk: "low" },
  { name: "James Okonkwo", age: 67, sex: "M", last: "Today", next: "Today", visits: 18, tag: "Pre-op", hue: 160, bp: "130/85", risk: "high" },
  { name: "Sara Anders", age: 51, sex: "F", last: "2w ago", next: "May 19", visits: 5, tag: "6mo check", hue: 50, bp: "120/78", risk: "low" },
  { name: "Alex Rivera", age: 38, sex: "M", last: "New", next: "Today", visits: 0, tag: "New patient", hue: 210, bp: "-", risk: "low" },
  { name: "Maria Conte", age: 74, sex: "F", last: "5d ago", next: "Jun 12", visits: 24, tag: "Refill", hue: 0, bp: "138/82", risk: "med" },
  { name: "Carlos Vega", age: 62, sex: "M", last: "1w ago", next: "Jun 05", visits: 9, tag: "Post-MI", hue: 30, bp: "132/88", risk: "high" },
];

export const phaseCards = [
  { phase: "Phase 1", title: "Production care core", icon: Stethoscope, detail: "Accessible UI, booking, medical records, prescriptions, WebRTC consults, payments, audit logs." },
  { phase: "Phase 2", title: "Enterprise operations", icon: Building2, detail: "Multi-clinic orgs, departments, referrals, insurance eligibility, claims, BI, API v1." },
  { phase: "Phase 3", title: "Advanced intelligence", icon: Sparkles, detail: "AI scheduling, no-show prediction, patient engagement, outcomes tracking, marketplace." },
  { phase: "Phase 4", title: "Scale platform", icon: Globe2, detail: "Global compliance, SSO/SAML, FHIR/EHR integrations, data warehouse, uptime operations." },
];

export function Headshot({ name, hue = 210, size = 40 }: { name: string; hue?: number; size?: number }) {
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
        letterSpacing: "-.02em",
        boxShadow: "inset 0 -10px 30px rgba(0,0,0,.18), inset 0 6px 14px rgba(255,255,255,.18)",
        flexShrink: 0,
      }}
      aria-label={name}
    >
      {initials}
    </div>
  );
}

export function Spark({ index = 0, color = "var(--accent)", height = 32 }: { index?: number; color?: string; height?: number }) {
  const data = [3, 4, 3, 5, 4, 6, 5, 7, 6, 8].map((x) => x + index);
  const max = Math.max(...data);
  const min = Math.min(...data);
  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = height - 6 - ((value - min) / (max - min || 1)) * (height - 12);
    return [x, y];
  });
  const path = points.map((point, i) => `${i ? "L" : "M"}${point[0].toFixed(1)},${point[1].toFixed(1)}`).join(" ");
  return (
    <svg className="chart" viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" style={{ height }}>
      <path d={`${path} L100,${height} L0,${height} Z`} fill={color} opacity="0.14" />
      <path d={path} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function StatGrid({ items }: { items: Array<{ label: string; value: string; detail: string }> }) {
  return (
    <div className="bento" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
      {items.map((item, index) => (
        <div key={item.label} className="glass cell stat">
          <div className="eyebrow" style={{ marginBottom: 10 }}>{item.label}</div>
          <div className="row between" style={{ alignItems: "baseline" }}>
            <div className="val tnum">{item.value}</div>
            <span className="delta up"><Activity size={13} />{item.detail}</span>
          </div>
          <Spark index={index} />
        </div>
      ))}
    </div>
  );
}

export function PatientTable({ title = "Patients" }: { title?: string }) {
  return (
    <div className="fade-enter col gap-6">
      <div className="row between wrap gap-4">
        <div className="col" style={{ gap: 6 }}>
          <div className="eyebrow">{patients.length} active</div>
          <h1 className="h-1">{title}</h1>
        </div>
        <div className="row gap-3">
          <div className="search" style={{ minWidth: 280 }}>
            <Users size={16} style={{ color: "var(--ink-3)" }} />
            <input placeholder="Search by name or tag..." />
          </div>
          <button className="btn btn-primary">Add patient</button>
        </div>
      </div>
      <div className="glass" style={{ padding: 14 }}>
        <div className="row gap-2 wrap">
          {["All", "Seeing today", "New patients", "High risk"].map((filter, index) => (
            <button key={filter} className={`pill ${index === 0 ? "solid" : ""}`}>{filter}</button>
          ))}
        </div>
      </div>
      <div className="glass" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
          <thead>
            <tr style={{ textAlign: "left" }}>
              {["Patient", "Age", "BP", "Tag", "Visits", "Last seen", "Next visit", "Risk", ""].map((heading) => (
                <th key={heading} style={{ padding: "14px" }}><span className="eyebrow">{heading}</span></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {patients.map((patient, index) => (
              <tr key={patient.name} style={{ borderTop: "1px solid var(--line)" }}>
                <td style={{ padding: 14 }}>
                  <div className="row gap-3">
                    <Headshot name={patient.name} hue={patient.hue} size={36} />
                    <div className="col" style={{ gap: 2 }}>
                      <div style={{ fontWeight: 600 }}>{patient.name}</div>
                      <div className="tiny">#{1000 + index} · {patient.sex}</div>
                    </div>
                  </div>
                </td>
                <td className="tnum" style={{ padding: 14 }}>{patient.age}</td>
                <td className="tnum mono" style={{ padding: 14, fontSize: 12.5 }}>{patient.bp}</td>
                <td style={{ padding: 14 }}><span className="tag">{patient.tag}</span></td>
                <td className="tnum" style={{ padding: 14 }}>{patient.visits}</td>
                <td className="tiny" style={{ padding: 14 }}>{patient.last}</td>
                <td style={{ padding: 14, fontWeight: patient.next === "Today" ? 700 : 500, color: patient.next === "Today" ? "var(--accent)" : "var(--ink)" }}>{patient.next}</td>
                <td style={{ padding: 14 }}><span className={`pill ${patient.risk === "high" ? "bad" : patient.risk === "med" ? "warn" : "good"}`}>{patient.risk}</span></td>
                <td style={{ padding: 14 }}><span className="icon-btn"><ChevronRight size={14} /></span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function PhaseReadiness() {
  return (
    <div className="bento" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
      {phaseCards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.phase} className="glass cell">
            <div className="row between" style={{ marginBottom: 18 }}>
              <span className="pill accent">{card.phase}</span>
              <Icon size={18} style={{ color: "var(--accent)" }} />
            </div>
            <div className="h-4">{card.title}</div>
            <p className="small" style={{ marginTop: 8 }}>{card.detail}</p>
          </div>
        );
      })}
    </div>
  );
}

export function PrototypePanel({ icon: Icon, eyebrow, title, children }: { icon: LucideIcon; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <div className="glass" style={{ padding: 22 }}>
      <div className="row gap-2" style={{ marginBottom: 12 }}>
        <Icon size={17} style={{ color: "var(--accent)" }} />
        <div className="eyebrow">{eyebrow}</div>
      </div>
      <div className="h-4" style={{ marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}

export function EnterpriseGrid() {
  const modules = [
    { icon: Building2, title: "Multi-clinic", detail: "Departments, staff roles, clinic capacity, and inter-clinic referrals." },
    { icon: CreditCard, title: "Insurance", detail: "EDI eligibility, claims, remittance, denial queues, patient estimates." },
    { icon: BarChart3, title: "Analytics", detail: "BI reports, benchmarks, forecasting, KPI tracking, and data aggregation." },
    { icon: Globe2, title: "Global scale", detail: "Regional compliance, SSO/SAML, FHIR connectors, disaster recovery." },
  ];
  return (
    <div className="bento" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
      {modules.map((module) => (
        <PrototypePanel key={module.title} icon={module.icon} eyebrow="Module" title={module.title}>
          <p className="small">{module.detail}</p>
        </PrototypePanel>
      ))}
    </div>
  );
}

export function PatientPortalHero() {
  return (
    <div className="hero" style={{ paddingTop: 12 }}>
      <div className="col gap-5">
        <div className="pill accent" style={{ width: "fit-content" }}><Sparkles size={12} /> AI-guided care</div>
        <h1 className="h-display">Your care, <span className="hero-italic" style={{ color: "var(--accent)" }}>flowing</span>.</h1>
        <p className="body" style={{ maxWidth: 580 }}>Book appointments, use voice intake, join video visits, manage prescriptions, and track health records in one MedFlow experience.</p>
        <div className="row gap-3 wrap">
          <a href="/client/book" className="btn btn-primary">Book appointment <ArrowRight size={15} /></a>
          <a href="/client/appointments" className="btn btn-glass">My appointments</a>
        </div>
      </div>
      <div className="glass-strong" style={{ padding: 24 }}>
        <div className="row between" style={{ marginBottom: 18 }}>
          <div>
            <div className="eyebrow">Next visit</div>
            <div className="h-3">Dr. Sarah Jenkins</div>
          </div>
          <span className="pill good"><Video size={11} /> Video ready</span>
        </div>
        <div className="col gap-3">
          {["Symptom intake complete", "Insurance verified", "Pre-visit brief generated"].map((item) => (
            <div key={item} className="row gap-3">
              <span className="icon-btn" style={{ color: "var(--good)" }}><Check size={14} /></span>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export const quickStats = [
  { label: "Active clinics", value: "142", detail: "+18%" },
  { label: "Visits monthly", value: "86k", detail: "+24%" },
  { label: "Clean claims", value: "94%", detail: "+7%" },
  { label: "Uptime", value: "99.99", detail: "SLA" },
];

export { Activity, CalendarDays, FileText, HeartPulse, MessageCircle, Phone, ShieldCheck, Sparkles, Video };
