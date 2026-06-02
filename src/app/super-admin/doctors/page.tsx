"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Plus, Search, ShieldCheck, XCircle } from "lucide-react";
import { EnterpriseGrid, Headshot } from "@/components/medflow/Prototype";
import { useAuth } from "@/context/AuthContext";

type Doctor = {
  id: string;
  specialty: string;
  rating: number;
  total_reviews: number;
  consultation_fee: number;
  is_verified: boolean;
  clinic_name: string | null;
  experience_years: number | null;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
    is_active: boolean;
  };
};

export default function DoctorsPage() {
  const { user, getToken } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getToken().then(async token => {
      if (!token) { setLoading(false); return; }
      const res = await fetch("/api/super-admin/doctors", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setDoctors(data.doctors ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  const toggle = async (doctorId: string, currentlyVerified: boolean) => {
    setUpdating(doctorId);
    const token = await getToken();
    if (!token) { setUpdating(null); return; }
    const res = await fetch("/api/super-admin/doctors", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ doctorId, is_verified: !currentlyVerified }),
    });
    if (res.ok) {
      setDoctors(prev => prev.map(d => d.id === doctorId ? { ...d, is_verified: !currentlyVerified } : d));
    }
    setUpdating(null);
  };

  const filtered = doctors.filter(d =>
    `${d.profiles?.full_name ?? ""} ${d.specialty} ${d.clinic_name ?? ""}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fade-enter col gap-7">
      <div className="row between wrap gap-4">
        <div>
          <div className="eyebrow">Phase 2</div>
          <h1 className="h-1">Doctors and providers</h1>
        </div>
        <div className="row gap-3">
          <div className="search" style={{ minWidth: 240 }}>
            <Search size={16} style={{ color: "var(--ink-3)" }} />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search doctors..." />
          </div>
          <button className="btn btn-primary"><Plus size={14} /> Add doctor</button>
        </div>
      </div>

      <EnterpriseGrid />

      <div className="glass" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div className="col gap-3" style={{ padding: 16 }}>
            {[1, 2, 3].map(i => <div key={i} style={{ height: 52, borderRadius: 10, border: "1px solid var(--line)", opacity: 0.4 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div className="small" style={{ color: "var(--ink-3)" }}>{query ? "No results." : "No doctors found."}</div>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid var(--line)" }}>
                {["Doctor", "Specialty", "Clinic", "Rating", "Fee", "Status", "Action"].map(h => (
                  <th key={h} style={{ padding: "12px 16px" }}><span className="eyebrow">{h}</span></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc, index) => {
                const name = doc.profiles?.full_name ?? "Doctor";
                const hue = (() => { let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360; return h; })();
                return (
                  <tr key={doc.id} style={{ borderTop: "1px solid var(--line)" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div className="row gap-3">
                        <Headshot name={name} hue={hue} size={36} />
                        <div className="col" style={{ gap: 2 }}>
                          <div style={{ fontWeight: 600 }}>{name}</div>
                          <div className="tiny">{doc.profiles?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}><div className="small">{doc.specialty}</div></td>
                    <td style={{ padding: "12px 16px" }}><div className="small">{doc.clinic_name ?? "—"}</div></td>
                    <td style={{ padding: "12px 16px" }}>
                      <div className="tnum" style={{ fontWeight: 600 }}>
                        {doc.rating > 0 ? doc.rating.toFixed(1) : "—"}
                        {doc.total_reviews > 0 && <span className="tiny" style={{ color: "var(--ink-3)", marginLeft: 4 }}>({doc.total_reviews})</span>}
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div className="tnum small">${doc.consultation_fee}</div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {doc.is_verified
                        ? <span className="pill good"><ShieldCheck size={11} /> Verified</span>
                        : <span className="pill bad">Unverified</span>
                      }
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <button
                        className={`btn btn-sm ${doc.is_verified ? "btn-ghost" : "btn-primary"}`}
                        disabled={updating === doc.id}
                        onClick={() => toggle(doc.id, doc.is_verified)}
                      >
                        {doc.is_verified
                          ? <><XCircle size={13} /> Revoke</>
                          : <><CheckCircle2 size={13} /> Verify</>
                        }
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
