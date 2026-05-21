"use client";

import { CalendarDays, Check, Clock, FileText, Phone, Video } from "lucide-react";
import { Headshot } from "@/components/medflow/Prototype";

const visits = [
  { date: "Today", time: "2:30 PM", doctor: "Dr. Sarah Jenkins", reason: "Cardiology follow-up", mode: "Video", status: "Ready", hue: 340 },
  { date: "May 26", time: "9:00 AM", doctor: "Dr. Aisha Okafor", reason: "Annual check", mode: "In-person", status: "Confirmed", hue: 150 },
  { date: "Jun 02", time: "11:30 AM", doctor: "Dr. Marcus Chen", reason: "Sleep review", mode: "Voice", status: "Intake due", hue: 270 },
];

export default function ClientAppointments() {
  return (
    <div className="fade-enter col gap-7">
      <div className="row between wrap gap-4">
        <div className="col" style={{ gap: 6 }}>
          <div className="eyebrow">Care schedule</div>
          <h1 className="h-1">Appointments</h1>
          <p className="body">Join visits, complete intake, review records, and manage reminders.</p>
        </div>
        <a href="/client/book" className="btn btn-primary"><CalendarDays size={14} /> Book another visit</a>
      </div>
      <div className="glass" style={{ padding: 24 }}>
        <div className="col gap-3">
          {visits.map((visit) => (
            <div key={`${visit.date}-${visit.doctor}`} className="row gap-4" style={{ padding: 16, borderRadius: 18, border: "1px solid var(--line)" }}>
              <div className="col" style={{ gap: 2, minWidth: 74 }}>
                <div className="tnum" style={{ fontWeight: 800 }}>{visit.time}</div>
                <div className="tiny">{visit.date}</div>
              </div>
              <div className="vr" />
              <Headshot name={visit.doctor} hue={visit.hue} size={44} />
              <div className="grow">
                <div style={{ fontWeight: 800 }}>{visit.doctor}</div>
                <div className="small">{visit.reason}</div>
              </div>
              <span className="pill">{visit.mode === "Video" ? <Video size={11} /> : <Phone size={11} />}{visit.mode}</span>
              <span className={`pill ${visit.status === "Ready" ? "good" : "accent"}`}>{visit.status === "Ready" && <Check size={11} />}{visit.status}</span>
              <button className="btn btn-glass btn-sm"><FileText size={13} /> Details</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
