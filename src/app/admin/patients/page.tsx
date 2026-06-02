"use client";

import { useEffect, useState } from "react";
import { Activity, FileText, HeartPulse, MessageCircle, Search, ShieldCheck, Stethoscope, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type PatientRow = {
  patient_id: string;
  status: string;
  appointment_date: string;
  chief_complaint: string | null;
  profiles: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    blood_type: string | null;
    date_of_birth: string | null;
    health_stats: Record<string, string | number> | null;
  };
};

function nameHue(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

function Headshot({ name, size }: { name: string; size: number }) {
  const hue = nameHue(name);
  const initials = name.split(" ").map(p => p[0]).slice(0, 2).join("");
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `linear-gradient(135deg, hsl(${hue} 65% 65%), hsl(${(hue + 40) % 360} 60% 40%))`,
      display: "grid", placeItems: "center", color: "#fff",
      fontWeight: 700, fontSize: size * 0.33,
    }}>{initials}</div>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function PatientsPage() {
  const { user, getToken } = useAuth();
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [selected, setSelected] = useState<PatientRow | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getToken().then(async token => {
      const res = await fetch("/api/doctor/patients", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      const rows: PatientRow[] = data.patients ?? [];
      setPatients(rows);
      if (rows.length > 0) setSelected(rows[0]);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  const filtered = patients.filter(p =>
    `${p.profiles?.full_name ?? ""} ${p.chief_complaint ?? ""} ${p.profiles?.blood_type ?? ""}`
      .toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fade-enter col gap-7">
      <div className="row between wrap gap-4">
        <div className="col" style={{ gap: 6 }}>
          <div className="eyebrow">Longitudinal care</div>
          <h1 className="h-1">Patient records</h1>
          <p className="body">Clinical timeline, outcomes, and engagement in one record.</p>
        </div>
        <div className="search" style={{ minWidth: 280 }}>
          <Search size={16} style={{ color: "var(--ink-3)" }} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search patients" />
        </div>
      </div>

      <div className="admin-grid" style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 20, alignItems: "start" }}>
        <div className="glass" style={{ padding: 0, overflow: "hidden" }}>
          {loading ? (
            <div className="col gap-3" style={{ padding: 16 }}>
              {[1, 2, 3, 4].map(i => <div key={i} style={{ height: 52, borderRadius: 12, border: "1px solid var(--line)", opacity: 0.4 }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div className="small" style={{ color: "var(--ink-3)" }}>{query ? "No results." : "No patients yet."}</div>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid var(--line)" }}>
                  {["Patient", "Last complaint", "Blood type", "Last visit", ""].map(h => (
                    <th key={h} style={{ padding: "12px 16px" }}><span className="eyebrow">{h}</span></th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(row => {
                  const name = row.profiles?.full_name ?? "Patient";
                  const isSelected = selected?.patient_id === row.patient_id;
                  return (
                    <tr
                      key={row.patient_id}
                      onClick={() => setSelected(row)}
                      style={{
                        borderTop: "1px solid var(--line)", cursor: "pointer",
                        background: isSelected ? "color-mix(in oklab, var(--accent) 6%, transparent)" : "transparent",
                      }}
                    >
                      <td style={{ padding: "12px 16px" }}>
                        <div className="row gap-3">
                          <Headshot name={name} size={36} />
                          <div className="col" style={{ gap: 2 }}>
                            <div style={{ fontWeight: 600 }}>{name}</div>
                            <div className="tiny">{row.profiles?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div className="small">{row.chief_complaint ?? "—"}</div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {row.profiles?.blood_type
                          ? <span className="pill">{row.profiles.blood_type}</span>
                          : <span className="tiny" style={{ color: "var(--ink-3)" }}>—</span>
                        }
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div className="tiny">{row.appointment_date ? formatDate(row.appointment_date) : "—"}</div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span className={`pill ${row.status === "completed" ? "good" : row.status === "confirmed" ? "accent" : ""}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="col gap-4">
          {selected ? (
            <>
              <div className="glass" style={{ padding: 22 }}>
                <div className="row gap-4" style={{ marginBottom: 18 }}>
                  <Headshot name={selected.profiles?.full_name ?? "P"} size={56} />
                  <div className="col" style={{ gap: 4 }}>
                    <div className="eyebrow">Patient record</div>
                    <div className="h-3">{selected.profiles?.full_name ?? "Patient"}</div>
                    <div className="small">{selected.profiles?.email}</div>
                  </div>
                </div>
                <div className="bento" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 0 }}>
                  <Metric label="Blood type" value={selected.profiles?.blood_type ?? "—"} />
                  <Metric label="BP" value={selected.profiles?.health_stats?.bp ? String(selected.profiles.health_stats.bp) : "—"} />
                  <Metric label="Last visit" value={selected.appointment_date ? formatDate(selected.appointment_date) : "—"} />
                </div>
              </div>
              <div className="glass" style={{ padding: 22 }}>
                <div className="h-4" style={{ marginBottom: 14 }}>Clinical notes</div>
                <div className="col gap-3">
                  <div style={{ padding: 14, borderRadius: 10, border: "1px solid var(--line)" }}>
                    <div className="row between" style={{ marginBottom: 4 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>Last complaint</div>
                      <span className="tiny" style={{ color: "var(--ink-3)" }}>{selected.appointment_date ? formatDate(selected.appointment_date) : ""}</span>
                    </div>
                    <div className="small">{selected.chief_complaint ?? "No chief complaint recorded."}</div>
                  </div>
                </div>
              </div>
              <div className="bento" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
                <ActionBtn icon={MessageCircle} label="Message" />
                <ActionBtn icon={FileText} label="Note" />
                <ActionBtn icon={ShieldCheck} label="Eligibility" />
                <ActionBtn icon={Stethoscope} label="Refer" />
              </div>
            </>
          ) : !loading && (
            <div className="glass" style={{ padding: 22, textAlign: "center" }}>
              <div className="small" style={{ color: "var(--ink-3)" }}>Select a patient to view details.</div>
            </div>
          )}
        </div>
      </div>

      <div className="bento" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <Program icon={HeartPulse} title="Outcome tracking" detail="PROMIS score, disease registry, and CQM evidence are captured." />
        <Program icon={Activity} title="Remote monitoring" detail="Wearable and home-device readings sync into patient risk." />
        <Program icon={TrendingUp} title="Engagement AI" detail="Personalized reminders reduce no-show risk and close care gaps." />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass cell" style={{ textAlign: "center", padding: 14 }}>
      <div className="eyebrow" style={{ marginBottom: 6 }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: 17 }}>{value}</div>
    </div>
  );
}

function ActionBtn({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <button className="btn btn-glass" style={{ justifyContent: "center", gap: 8, padding: "10px 0" }}>
      <Icon size={15} /> {label}
    </button>
  );
}

function Program({ icon: Icon, title, detail }: { icon: LucideIcon; title: string; detail: string }) {
  return (
    <div className="glass cell" style={{ padding: 20 }}>
      <Icon size={18} style={{ color: "var(--accent)" }} />
      <div style={{ fontWeight: 700, marginTop: 12, marginBottom: 6 }}>{title}</div>
      <div className="small" style={{ lineHeight: 1.6 }}>{detail}</div>
    </div>
  );
}
