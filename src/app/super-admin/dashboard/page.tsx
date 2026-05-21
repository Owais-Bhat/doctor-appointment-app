"use client";

import { EnterpriseGrid, PhaseReadiness, StatGrid, quickStats } from "@/components/medflow/Prototype";
import { Building2, Globe2, ShieldCheck, Sparkles } from "lucide-react";

export default function SuperAdminDashboard() {
  return (
    <div className="fade-enter col gap-7">
      <div className="row between wrap gap-4">
        <div className="col" style={{ gap: 6 }}>
          <div className="eyebrow">SaaS operator console</div>
          <h1 className="h-1">MedFlow scale command.</h1>
          <p className="body">All four phases in one operating layer: clinics, insurance, analytics, AI, compliance, and global integrations.</p>
        </div>
        <div className="row gap-3">
          <span className="pill good"><ShieldCheck size={11} /> 99.99 SLA</span>
          <button className="btn btn-primary"><Sparkles size={14} /> Launch phase</button>
        </div>
      </div>
      <StatGrid items={quickStats} />
      <PhaseReadiness />
      <EnterpriseGrid />
      <div className="admin-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div className="glass" style={{ padding: 24 }}>
          <div className="eyebrow">Global expansion</div>
          <div className="h-3" style={{ marginTop: 6 }}>Regions and compliance</div>
          <div className="col gap-3" style={{ marginTop: 18 }}>
            {["United States · HIPAA/CCPA", "European Union · GDPR", "Brazil · LGPD", "India · DPDP"].map((item) => (
              <div key={item} className="row between" style={{ padding: 14, borderRadius: 14, border: "1px solid var(--line)" }}>
                <span style={{ fontWeight: 600 }}>{item}</span>
                <span className="pill good">Ready</span>
              </div>
            ))}
          </div>
        </div>
        <div className="glass" style={{ padding: 24 }}>
          <div className="eyebrow">Enterprise integrations</div>
          <div className="h-3" style={{ marginTop: 6 }}>FHIR, EHR, labs, pharmacy</div>
          <div className="bento" style={{ gridTemplateColumns: "repeat(2, 1fr)", marginTop: 18 }}>
            {[Building2, Globe2, ShieldCheck, Sparkles].map((Icon, index) => (
              <div key={index} className="glass cell" style={{ padding: 18 }}>
                <Icon size={20} style={{ color: "var(--accent)" }} />
                <div style={{ fontWeight: 700, marginTop: 10 }}>{["Epic/Cerner", "Multi-region", "SAML SSO", "Clinical AI"][index]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
