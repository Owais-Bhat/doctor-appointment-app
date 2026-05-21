"use client";

import { Building2, Plus, ShieldCheck, Users } from "lucide-react";
import { EnterpriseGrid, Headshot } from "@/components/medflow/Prototype";

export default function ClinicsPage() {
  const clinics = ["Jenkins Cardiology", "Northside Primary", "Atlas Telehealth", "Metro Pediatrics", "River Oncology"];
  return (
    <div className="fade-enter col gap-7">
      <div className="row between wrap gap-4"><div><div className="eyebrow">Phase 2</div><h1 className="h-1">Clinics and organizations</h1></div><button className="btn btn-primary"><Plus size={14} /> Add clinic</button></div>
      <EnterpriseGrid />
      <div className="glass" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
          <thead><tr>{["Clinic", "Providers", "Compliance", "Plan", "Status"].map((h) => <th key={h} style={{ padding: 14, textAlign: "left" }}><span className="eyebrow">{h}</span></th>)}</tr></thead>
          <tbody>{clinics.map((clinic, index) => <tr key={clinic} style={{ borderTop: "1px solid var(--line)" }}><td style={{ padding: 14 }}><div className="row gap-3"><Headshot name={clinic} hue={index * 70} size={36} /><b>{clinic}</b></div></td><td style={{ padding: 14 }}><Users size={14} /> {18 + index * 7}</td><td style={{ padding: 14 }}><span className="pill good"><ShieldCheck size={11} /> Ready</span></td><td style={{ padding: 14 }}>Enterprise</td><td style={{ padding: 14 }}><span className="pill accent"><Building2 size={11} /> Live</span></td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
