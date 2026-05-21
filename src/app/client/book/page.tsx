"use client";

import { Brain, CalendarDays, HeartPulse, Mic, Search, Sparkles, Stethoscope, Video } from "lucide-react";
import { MedFlowVoiceAssistant } from "@/components/MedFlowVoiceAssistant";
import { Headshot } from "@/components/medflow/Prototype";

const doctors = [
  { name: "Dr. Sarah Jenkins", spec: "Cardiology", sub: "Heart failure · Echo", hue: 340, next: "Today 2:30 PM", fee: "$120", modes: ["Video", "Voice", "In-person"] },
  { name: "Dr. Marcus Chen", spec: "Neurology", sub: "Migraine · Sleep", hue: 270, next: "Tomorrow 10:00 AM", fee: "$140", modes: ["Video", "Voice"] },
  { name: "Dr. Aisha Okafor", spec: "General Med", sub: "Family medicine", hue: 150, next: "Today 5:00 PM", fee: "$80", modes: ["Video", "Voice", "In-person"] },
];

export default function BookPage() {
  return (
    <div className="fade-enter col gap-7">
      <div className="row between wrap gap-4">
        <div className="col" style={{ gap: 6 }}>
          <div className="eyebrow">AI booking</div>
          <h1 className="h-1">Book care with <span className="hero-italic" style={{ color: "var(--accent)" }}>voice</span>.</h1>
          <p className="body">Map symptoms, pick a specialist, verify insurance, and reserve video, voice, or in-person visits.</p>
        </div>
        <div className="search" style={{ minWidth: 320 }}>
          <Search size={16} style={{ color: "var(--ink-3)" }} />
          <input placeholder="Search doctors or symptoms..." />
        </div>
      </div>

      <div className="admin-grid" style={{ display: "grid", gridTemplateColumns: ".85fr 1.15fr", gap: 20, alignItems: "start" }}>
        <div className="col gap-4">
          <MedFlowVoiceAssistant />
          <div className="glass" style={{ padding: 22 }}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>Symptom mapper</div>
            <div className="bento" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
              {[
                [HeartPulse, "Chest pain", "Cardiology"],
                [Brain, "Headaches", "Neurology"],
                [Stethoscope, "General concern", "Primary care"],
                [Mic, "Voice intake", "AI triage"],
              ].map(([Icon, label, spec]) => {
                const Ico = Icon as typeof HeartPulse;
                return (
                  <button key={String(label)} className="glass cell" style={{ textAlign: "left", padding: 16 }}>
                    <Ico size={18} style={{ color: "var(--accent)" }} />
                    <div style={{ fontWeight: 700, marginTop: 10 }}>{String(label)}</div>
                    <div className="tiny">{String(spec)}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="glass" style={{ padding: 24 }}>
          <div className="row between" style={{ marginBottom: 18 }}>
            <div>
              <div className="eyebrow">Recommended doctors</div>
              <div className="h-3">Available now</div>
            </div>
            <span className="pill accent"><Sparkles size={11} /> AI matched</span>
          </div>
          <div className="col gap-3">
            {doctors.map((doctor) => (
              <div key={doctor.name} className="row gap-4" style={{ padding: 16, borderRadius: 18, border: "1px solid var(--line)" }}>
                <Headshot name={doctor.name} hue={doctor.hue} size={56} />
                <div className="grow col" style={{ gap: 3 }}>
                  <div style={{ fontWeight: 800 }}>{doctor.name}</div>
                  <div className="small">{doctor.spec} · {doctor.sub}</div>
                  <div className="row gap-2 wrap" style={{ marginTop: 6 }}>
                    {doctor.modes.map((mode) => <span key={mode} className="pill">{mode}</span>)}
                  </div>
                </div>
                <div className="col" style={{ gap: 8, alignItems: "flex-end" }}>
                  <span className="pill good"><CalendarDays size={11} /> {doctor.next}</span>
                  <button className="btn btn-primary btn-sm"><Video size={13} /> Book {doctor.fee}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
