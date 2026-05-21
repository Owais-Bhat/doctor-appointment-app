"use client";

import { CalendarDays, FileText, HeartPulse, ShieldCheck, Video } from "@/components/medflow/Prototype";
import { PatientPortalHero, PhaseReadiness, PrototypePanel, StatGrid } from "@/components/medflow/Prototype";

export default function ClientDashboard() {
  return (
    <div className="fade-enter col gap-7">
      <PatientPortalHero />
      <StatGrid
        items={[
          { label: "Upcoming visits", value: "3", detail: "2 video" },
          { label: "Health score", value: "92", detail: "+4" },
          { label: "Records", value: "18", detail: "synced" },
          { label: "Messages", value: "6", detail: "2 new" },
        ]}
      />
      <div className="admin-grid" style={{ display: "grid", gridTemplateColumns: "1.2fr .8fr", gap: 20 }}>
        <div className="glass" style={{ padding: 24 }}>
          <div className="row between" style={{ marginBottom: 18 }}>
            <div>
              <div className="eyebrow">Care timeline</div>
              <div className="h-3">What&apos;s next</div>
            </div>
            <span className="pill good"><ShieldCheck size={11} /> Consent active</span>
          </div>
          <div className="col gap-3">
            {[
              ["Today", "AI voice intake", "Describe symptoms and confirm preferred visit mode."],
              ["May 20", "Video consultation", "Dr. Sarah Jenkins · Cardiology · 30m."],
              ["May 21", "Medication refill", "Atorvastatin renewal ready for pharmacy review."],
            ].map(([date, title, detail]) => (
              <div key={title} className="row gap-4" style={{ padding: 14, borderRadius: 14, border: "1px solid var(--line)" }}>
                <div className="pill accent tnum">{date}</div>
                <div className="grow">
                  <div style={{ fontWeight: 700 }}>{title}</div>
                  <div className="small">{detail}</div>
                </div>
                <Video size={16} style={{ color: "var(--accent)" }} />
              </div>
            ))}
          </div>
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
      <PhaseReadiness />
    </div>
  );
}
