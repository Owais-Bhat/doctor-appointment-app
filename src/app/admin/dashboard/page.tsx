"use client";

import { useEffect, useState } from "react";
import { ChevronRight, Filter, MapPin, Phone, Plus, Sparkles, Video } from "lucide-react";
import { MedFlowVoiceAssistant } from "@/components/MedFlowVoiceAssistant";
import { useAuth } from "@/context/AuthContext";

type Appointment = {
  id: string;
  appointment_time: string;
  status: string;
  consultation_type: string;
  chief_complaint: string | null;
  profiles: { full_name: string };
};

type Stats = {
  today_count: number;
  rating: number;
  total_reviews: number;
  revenue_mtd: number;
  total_patients: number;
};

function Headshot({ name, hue, size }: { name: string; hue: number; size: number }) {
  const initials = name.split(" ").map(p => p[0]).slice(0, 2).join("");
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `linear-gradient(135deg, hsl(${hue} 65% 65%), hsl(${(hue + 40) % 360} 60% 40%))`,
      display: "grid", placeItems: "center", color: "#fff",
      fontWeight: 600, fontSize: size * 0.32,
      boxShadow: "inset 0 -10px 30px rgba(0,0,0,.18), inset 0 6px 14px rgba(255,255,255,.18)", flexShrink: 0,
    }}>{initials}</div>
  );
}

function nameHue(name: string) {
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360; return h;
}
function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export default function DoctorDashboard() {
  const { user, getToken } = useAuth();
  const [schedule, setSchedule] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      try {
        const token = await getToken();
        const headers = { Authorization: `Bearer ${token}` };
        const [scheduleResponse, statsResponse] = await Promise.all([
          fetch('/api/doctor/schedule', { headers }).then(response => response.json()),
          fetch('/api/doctor/stats', { headers }).then(response => response.json()),
        ]);

        if (!cancelled) {
          setSchedule(scheduleResponse.appointments ?? []);
          setStats(statsResponse.stats ?? null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [user, getToken]);

  const doctorName = user?.displayName ?? "Doctor";
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  const kpis = stats ? [
    { label: "Today's appointments", value: String(stats.today_count), detail: "scheduled" },
    { label: "Patient satisfaction", value: stats.rating > 0 ? stats.rating.toFixed(1) : "—", detail: `${stats.total_reviews} reviews` },
    { label: "Total patients", value: String(stats.total_patients), detail: "seen" },
    { label: "Revenue MTD", value: `$${stats.revenue_mtd.toLocaleString()}`, detail: "completed visits" },
  ] : [
    { label: "Today's appointments", value: "—", detail: "" },
    { label: "Patient satisfaction", value: "—", detail: "" },
    { label: "Total patients", value: "—", detail: "" },
    { label: "Revenue MTD", value: "—", detail: "" },
  ];

  return (
    <div className="fade-enter col gap-7">
      <div className="row between wrap gap-4">
        <div className="portal-hero">
          <div className="eyebrow">Doctor&apos;s view</div>
          <h1 className="h-1 portal-title">
            Good morning, <span className="hero-italic" style={{ color: "var(--accent)" }}>{doctorName}</span>.
          </h1>
          <p className="body">
            {loading ? "Loading your schedule…" : schedule.length === 0
              ? "No appointments scheduled for today."
              : `${schedule.length} appointment${schedule.length !== 1 ? 's' : ''} today.`}
          </p>
        </div>
        <div className="row gap-3">
          <button className="btn btn-ghost"><Filter size={14} /> Filter</button>
          <button className="btn btn-primary"><Plus size={14} /> Add slot</button>
        </div>
      </div>

      <div className="bento" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        {kpis.map((kpi) => (
          <div key={kpi.label} className="glass cell stat">
            <div className="eyebrow" style={{ marginBottom: 10 }}>{kpi.label}</div>
            <div className="row between" style={{ alignItems: "baseline" }}>
              <div className="val tnum">{kpi.value}</div>
              {kpi.detail && <span className="tiny" style={{ color: "var(--ink-3)" }}>{kpi.detail}</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="admin-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, alignItems: "start" }}>
        <div className="glass" style={{ padding: 24 }}>
          <div className="row between" style={{ marginBottom: 18 }}>
            <div className="col" style={{ gap: 4 }}>
              <div className="eyebrow">Schedule</div>
              <div className="h-3">{today}</div>
            </div>
            <div className="tabs">
              <button className="tab active">Today</button>
              <button className="tab">Tomorrow</button>
              <button className="tab">Week</button>
            </div>
          </div>

          {loading ? (
            <div className="col gap-2">
              {[1, 2, 3].map(i => <div key={i} style={{ height: 56, borderRadius: 14, border: "1px solid var(--line)", opacity: 0.4 }} />)}
            </div>
          ) : schedule.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <div className="small">No appointments today.</div>
            </div>
          ) : (
            <div className="col gap-2">
              {schedule.map((item, index) => {
                const patientName = item.profiles?.full_name ?? "Patient";
                return (
                  <div key={item.id} className="dashboard-list-row row gap-4" style={{
                    padding: "12px 14px", borderRadius: 14,
                    background: item.status === "confirmed" && index === 0 ? "color-mix(in oklab, var(--accent) 10%, transparent)" : "transparent",
                    border: item.status === "confirmed" && index === 0 ? "1px solid color-mix(in oklab, var(--accent) 24%, transparent)" : "1px solid var(--line)",
                    alignItems: "center",
                  }}>
                    <div className="col" style={{ gap: 2, minWidth: 60 }}>
                      <div className="tnum" style={{ fontWeight: 700, fontSize: 15 }}>{formatTime(item.appointment_time)}</div>
                    </div>
                    <div className="vr" />
                    <Headshot name={patientName} hue={nameHue(patientName)} size={36} />
                    <div className="grow col" style={{ gap: 2 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{patientName}</div>
                      <div className="tiny">{item.chief_complaint ?? item.consultation_type}</div>
                    </div>
                    <span className="pill">
                      {item.consultation_type === 'video' ? <Video size={11} /> : item.consultation_type === 'phone' ? <Phone size={11} /> : <MapPin size={11} />}
                      {item.consultation_type === 'in_person' ? 'In-person' : item.consultation_type}
                    </span>
                    {index === 0 ? <button className="btn btn-primary btn-sm"><Phone size={13} /> Join</button>
                      : <ChevronRight size={16} style={{ color: "var(--ink-3)" }} />}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="col gap-4">
          <MedFlowVoiceAssistant />
          <div className="glass" style={{ padding: 22 }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>AI suggestions</div>
            <div className="row gap-3">
              <div style={{ color: "var(--accent)" }}><Sparkles size={20} /></div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Stay on top of follow-ups</div>
                <div className="small" style={{ fontSize: 13 }}>Review your patient list to find anyone overdue for a check-in.</div>
                <div className="row gap-2" style={{ marginTop: 10 }}>
                  <a href="/admin/patients" className="btn btn-primary btn-sm">View patients</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
