"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, ExternalLink, FileText, MapPin, MessageSquare, Phone, Search, ShieldCheck, Video, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type Appointment = {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  consultation_type: string;
  chief_complaint: string | null;
  profiles: { full_name: string; phone: string | null };
};

const STAGES = [
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

export default function AppointmentKanban() {
  const { user, getToken } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getToken().then(async token => {
      const res = await fetch("/api/doctor/schedule", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      const appts: Appointment[] = data.appointments ?? [];
      setAppointments(appts);
      if (appts.length > 0) setSelected(appts[0]);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    const token = await getToken();
    const res = await fetch(`/api/doctor/appointments/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
      setSelected(prev => prev?.id === id ? { ...prev, status } : prev);
    }
    setUpdating(null);
  };

  const joinVideo = (appointmentId: string) => {
    window.open(`https://meet.jit.si/medflow-${appointmentId}`, "_blank", "noopener");
  };

  const filtered = appointments.filter(item =>
    `${item.profiles?.full_name ?? ""} ${item.chief_complaint ?? ""} ${item.consultation_type}`
      .toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fade-enter col gap-7">
      <div className="row between wrap gap-4">
        <div className="col">
          <div className="eyebrow">Appointment operations</div>
          <h1 className="h-1">Today's visit pipeline</h1>
          <p className="body">Today's schedule organized by status. Confirm, complete, or join visits.</p>
        </div>
        <div className="search" style={{ minWidth: 280 }}>
          <Search size={16} style={{ color: "var(--ink-3)" }} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search queue" />
        </div>
      </div>

      <div className="admin-grid" style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20, alignItems: "start" }}>
        <div className="glass" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${STAGES.length}, 1fr)`, minWidth: 760, borderBottom: "1px solid var(--line)", background: "var(--glass)" }}>
              {STAGES.map(stage => (
                <div key={stage.key} style={{ padding: "12px 16px", borderRight: "1px solid var(--line)" }}>
                  <div className="eyebrow">{stage.label}</div>
                  <div className="tiny" style={{ color: "var(--ink-3)", marginTop: 2 }}>
                    {loading ? "…" : filtered.filter(a => a.status === stage.key).length} visits
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${STAGES.length}, 1fr)`, minWidth: 760 }}>
              {STAGES.map(stage => (
                <div key={stage.key} style={{ minHeight: 420, padding: 12, borderRight: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: 10 }}>
                  {loading ? (
                    [1, 2].map(i => <div key={i} style={{ height: 80, borderRadius: 12, border: "1px solid var(--line)", opacity: 0.4 }} />)
                  ) : filtered.filter(a => a.status === stage.key).length === 0 ? (
                    <div style={{ padding: "16px 0", textAlign: "center" }}>
                      <div className="tiny" style={{ color: "var(--ink-3)" }}>Empty</div>
                    </div>
                  ) : filtered.filter(a => a.status === stage.key).map(item => {
                    const isSelected = selected?.id === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setSelected(item)}
                        style={{
                          width: "100%", textAlign: "left", padding: 14, borderRadius: 12,
                          border: isSelected ? "1px solid color-mix(in oklab, var(--accent) 50%, transparent)" : "1px solid var(--line)",
                          background: isSelected ? "color-mix(in oklab, var(--accent) 8%, transparent)" : "transparent",
                          cursor: "pointer",
                        }}
                      >
                        <div className="row between" style={{ marginBottom: 6 }}>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{item.profiles?.full_name ?? "Patient"}</div>
                          <span className="tnum" style={{ fontSize: 11, color: "var(--ink-3)" }}>{formatTime(item.appointment_time)}</span>
                        </div>
                        <div className="tiny" style={{ marginBottom: 8 }}>{item.chief_complaint ?? item.consultation_type}</div>
                        <span className="pill" style={{ fontSize: 11 }}>
                          {item.consultation_type === "video" ? <Video size={10} /> : item.consultation_type === "phone" ? <Phone size={10} /> : <MapPin size={10} />}
                          {item.consultation_type === "in_person" ? "In-person" : item.consultation_type}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col gap-4">
          {selected ? (
            <div className="glass" style={{ padding: 22 }}>
              <div className="row between" style={{ marginBottom: 16 }}>
                <div className="col" style={{ gap: 4 }}>
                  <div className="eyebrow">Selected visit</div>
                  <div className="h-3">{selected.profiles?.full_name ?? "Patient"}</div>
                  <div className="small">{selected.chief_complaint ?? selected.consultation_type}</div>
                </div>
                <span className={`pill ${selected.status === "confirmed" ? "good" : selected.status === "completed" ? "" : selected.status === "cancelled" ? "bad" : "accent"}`}>
                  {selected.status}
                </span>
              </div>
              <div className="col gap-3" style={{ marginBottom: 16 }}>
                <Detail icon={Clock3} label="Time" value={`${formatTime(selected.appointment_time)}, today`} />
                <Detail icon={ShieldCheck} label="Type" value={selected.consultation_type === "in_person" ? "In-person visit" : selected.consultation_type === "video" ? "Video consultation" : "Phone call"} />
                <Detail icon={FileText} label="Complaint" value={selected.chief_complaint ?? "Not specified"} />
                {selected.profiles?.phone && (
                  <Detail icon={MessageSquare} label="Patient phone" value={selected.profiles.phone} />
                )}
              </div>
              <div className="col gap-2">
                {selected.consultation_type === "video" && selected.status === "confirmed" && (
                  <button
                    className="btn btn-primary"
                    style={{ justifyContent: "center" }}
                    onClick={() => joinVideo(selected.id)}
                  >
                    <ExternalLink size={14} /> Join video call
                  </button>
                )}
                {selected.status === "pending" && (
                  <button
                    className="btn btn-primary"
                    style={{ justifyContent: "center" }}
                    disabled={updating === selected.id}
                    onClick={() => updateStatus(selected.id, "confirmed")}
                  >
                    <CheckCircle2 size={14} /> {updating === selected.id ? "Confirming…" : "Confirm appointment"}
                  </button>
                )}
                {selected.status === "confirmed" && (
                  <button
                    className="btn btn-glass"
                    style={{ justifyContent: "center" }}
                    disabled={updating === selected.id}
                    onClick={() => updateStatus(selected.id, "completed")}
                  >
                    <CheckCircle2 size={14} /> {updating === selected.id ? "Completing…" : "Mark completed"}
                  </button>
                )}
                {(selected.status === "pending" || selected.status === "confirmed") && (
                  <button
                    className="btn btn-ghost"
                    style={{ justifyContent: "center", color: "var(--warn, #e53e3e)" }}
                    disabled={updating === selected.id}
                    onClick={() => updateStatus(selected.id, "cancelled")}
                  >
                    <XCircle size={14} /> Cancel appointment
                  </button>
                )}
              </div>
            </div>
          ) : !loading && (
            <div className="glass" style={{ padding: 22, textAlign: "center" }}>
              <div className="small" style={{ color: "var(--ink-3)" }}>No appointments today.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Detail({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div style={{ padding: 12, borderRadius: 10, border: "1px solid var(--line)", background: "var(--glass)" }}>
      <div className="row gap-2" style={{ marginBottom: 4 }}>
        <Icon size={12} style={{ color: "var(--ink-3)" }} />
        <span className="eyebrow" style={{ fontSize: 10 }}>{label}</span>
      </div>
      <div className="small" style={{ lineHeight: 1.5 }}>{value}</div>
    </div>
  );
}
