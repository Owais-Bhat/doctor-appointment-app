"use client";

import { useEffect, useState } from "react";
import { CalendarDays, FileText, HeartPulse, ShieldCheck, Video } from "@/components/medflow/Prototype";
import { PrototypePanel } from "@/components/medflow/Prototype";
import { useAuth } from "@/context/AuthContext";

type Appointment = {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  consultation_type: string;
  doctor_profiles: {
    specialty: string;
    profiles: { full_name: string };
  };
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

export default function ClientDashboard() {
  const { user, getToken } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getToken().then(token =>
      fetch('/api/patient/appointments', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => {
          const upcoming = (d.appointments ?? []).filter((a: Appointment) =>
            ['confirmed', 'pending'].includes(a.status)
          );
          setAppointments(upcoming.slice(0, 3));
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    );
  }, [user]);

  return (
    <div className="fade-enter col gap-7">
      <div className="col" style={{ gap: 12 }}>
        <div className="eyebrow">Patient portal</div>
        <h1 className="h-1" style={{ marginBottom: 0 }}>Your health, <span className="hero-italic" style={{ color: "var(--accent)" }}>flowing</span>.</h1>
        <p className="body" style={{ marginTop: 8 }}>Book appointments, join video visits, and track your health records.</p>
        <div className="row gap-3 wrap">
          <a href="/client/book" className="btn btn-primary"><CalendarDays size={14} /> Book appointment</a>
          <a href="/client/appointments" className="btn btn-ghost">My appointments</a>
        </div>
      </div>

      <div className="bento" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        {[
          { label: "Upcoming visits", value: loading ? "—" : String(appointments.length) },
          { label: "Health score", value: "—" },
          { label: "Records", value: "—" },
          { label: "Messages", value: "—" },
        ].map((stat, i) => (
          <div key={stat.label} className="glass cell stat">
            <div className="eyebrow" style={{ marginBottom: 10 }}>{stat.label}</div>
            <div className="val tnum">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="admin-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
        <div className="glass" style={{ padding: 24 }}>
          <div className="row between" style={{ marginBottom: 18 }}>
            <div>
              <div className="eyebrow">Care timeline</div>
              <div className="h-3">Upcoming visits</div>
            </div>
            <span className="pill good"><ShieldCheck size={11} /> Consent active</span>
          </div>

          {loading ? (
            <div className="col gap-3">
              {[1, 2, 3].map(i => <div key={i} style={{ height: 60, borderRadius: 14, border: "1px solid var(--line)", opacity: 0.4 }} />)}
            </div>
          ) : appointments.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div className="small" style={{ marginBottom: 14 }}>No upcoming appointments.</div>
              <a href="/client/book" className="btn btn-primary btn-sm"><CalendarDays size={13} /> Book now</a>
            </div>
          ) : (
            <div className="col gap-3">
              {appointments.map(appt => {
                const doctorName = appt.doctor_profiles?.profiles?.full_name ?? "Doctor";
                return (
                  <div key={appt.id} className="dashboard-list-row row gap-4" style={{ padding: 14, borderRadius: 14, border: "1px solid var(--line)" }}>
                    <div className="pill accent tnum">{formatDate(appt.appointment_date)}</div>
                    <div className="grow">
                      <div style={{ fontWeight: 700 }}>{doctorName}</div>
                      <div className="small">{appt.doctor_profiles?.specialty} · {formatTime(appt.appointment_time)}</div>
                    </div>
                    <Video size={16} style={{ color: "var(--accent)" }} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="col gap-4">
          <PrototypePanel icon={HeartPulse} eyebrow="Vitals" title="Remote monitoring">
            <p className="small">Blood pressure, sleep, heart rate, and symptom trends are ready for your clinician.</p>
          </PrototypePanel>
          <PrototypePanel icon={FileText} eyebrow="Records" title="Encrypted medical file">
            <p className="small">Labs, prescriptions, visit notes, and insurance cards are organized with access logging.</p>
          </PrototypePanel>
          <PrototypePanel icon={CalendarDays} eyebrow="Booking" title="AI appointment desk">
            <p className="small">Voice scheduling routes you to the right provider and checks availability instantly.</p>
          </PrototypePanel>
        </div>
      </div>
    </div>
  );
}
