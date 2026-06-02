"use client";

import { useEffect, useState } from "react";
import { Building2, Globe2, ShieldCheck, Sparkles } from "lucide-react";
import { PhaseReadiness, EnterpriseGrid } from "@/components/medflow/Prototype";
import { useAuth } from "@/context/AuthContext";

type Stats = {
  total_users: number;
  total_doctors: number;
  total_appointments: number;
  active_patients: number;
};

export default function SuperAdminDashboard() {
  const { user, getToken } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!user) return;
    getToken().then(async token => {
      if (!token) return;
      const res = await fetch("/api/super-admin/stats", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.stats) setStats(data.stats);
    }).catch(console.error);
  }, [user]);

  const kpis = stats ? [
    { label: "Total users", value: String(stats.total_users), detail: "registered" },
    { label: "Verified doctors", value: String(stats.total_doctors), detail: "active" },
    { label: "Total appointments", value: String(stats.total_appointments), detail: "all time" },
    { label: "Active patients", value: String(stats.active_patients), detail: "accounts" },
  ] : [
    { label: "Total users", value: "—", detail: "" },
    { label: "Verified doctors", value: "—", detail: "" },
    { label: "Total appointments", value: "—", detail: "" },
    { label: "Active patients", value: "—", detail: "" },
  ];

  return (
    <div className="fade-enter col gap-7">
      <div className="row between wrap gap-4">
        <div className="col">
          <div className="eyebrow">SaaS operator console</div>
          <h1 className="h-1">MedFlow scale command.</h1>
          <p className="body">All four phases in one operating layer: clinics, insurance, analytics, AI, compliance, and global integrations.</p>
        </div>
        <div className="row gap-3">
          <span className="pill good"><ShieldCheck size={11} /> 99.99 SLA</span>
          <button className="btn btn-primary"><Sparkles size={14} /> Launch phase</button>
        </div>
      </div>

      <div className="bento" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        {kpis.map(kpi => (
          <div key={kpi.label} className="glass cell stat">
            <div className="eyebrow" style={{ marginBottom: 10 }}>{kpi.label}</div>
            <div className="row between" style={{ alignItems: "baseline" }}>
              <div className="val tnum">{kpi.value}</div>
              {kpi.detail && <span className="tiny" style={{ color: "var(--ink-3)" }}>{kpi.detail}</span>}
            </div>
          </div>
        ))}
      </div>

      <PhaseReadiness />
      <EnterpriseGrid />

      <div className="admin-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
        <div className="glass" style={{ padding: 24 }}>
          <div className="eyebrow">Global expansion</div>
          <div className="h-3" style={{ marginTop: 6 }}>Regions and compliance</div>
          <div className="col gap-3" style={{ marginTop: 18 }}>
            {["United States · HIPAA/CCPA", "European Union · GDPR", "Brazil · LGPD", "India · DPDP"].map(item => (
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
          <div className="bento" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", marginTop: 18 }}>
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
