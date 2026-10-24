"use client";

import { useEffect, useState } from "react";
import { Check, Edit2, HeartPulse, ShieldCheck, X } from "lucide-react";
import { Headshot } from "@/components/medflow/Prototype";
import { useAuth } from "@/context/AuthContext";
import { ReminderToggle } from "@/components/shared/ReminderToggle";

type Profile = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  blood_type: string | null;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
  health_stats: Record<string, any> | null;
  created_at: string;
};

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENDERS = ["Male", "Female", "Non-binary", "Prefer not to say"];

function nameHue(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

export default function ClientProfile() {
  const { user, getToken } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Editable form state
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    blood_type: "",
    date_of_birth: "",
    gender: "",
    address: "",
    health_stats: { bp: "", weight: "", height: "" },
  });

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getToken().then(token =>
      fetch("/api/patient/profile", { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => {
          const p: Profile = d.profile;
          setProfile(p);
          if (p) {
            setForm({
              full_name: p.full_name ?? "",
              phone: p.phone ?? "",
              blood_type: p.blood_type ?? "",
              date_of_birth: p.date_of_birth ?? "",
              gender: p.gender ?? "",
              address: p.address ?? "",
              health_stats: {
                bp: p.health_stats?.bp ?? "",
                weight: p.health_stats?.weight ?? "",
                height: p.health_stats?.height ?? "",
              },
            });
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    );
  }, [user]);

  const saveProfile = async () => {
    setSaving(true);
    const token = await getToken();
    const res = await fetch("/api/patient/profile", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: form.full_name,
        phone: form.phone || null,
        blood_type: form.blood_type || null,
        date_of_birth: form.date_of_birth || null,
        gender: form.gender || null,
        address: form.address || null,
        health_stats: {
          bp: form.health_stats.bp || null,
          weight: form.health_stats.weight ? Number(form.health_stats.weight) : null,
          height: form.health_stats.height ? Number(form.health_stats.height) : null,
        },
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setProfile(data.profile);
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  const cancelEdit = () => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? "",
        phone: profile.phone ?? "",
        blood_type: profile.blood_type ?? "",
        date_of_birth: profile.date_of_birth ?? "",
        gender: profile.gender ?? "",
        address: profile.address ?? "",
        health_stats: {
          bp: profile.health_stats?.bp ?? "",
          weight: profile.health_stats?.weight ?? "",
          height: profile.health_stats?.height ?? "",
        },
      });
    }
    setEditing(false);
  };

  const name = profile?.full_name ?? user?.displayName ?? "Patient";
  const inputStyle = { width: "100%", padding: "9px 12px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface-2)", fontSize: 14, fontFamily: "inherit" };

  return (
    <div className="fade-enter col gap-7">
      {/* Header */}
      <div className="glass pf-card" style={{ padding: 28 }}>
        <div className="row gap-5 pf-head">
          {loading
            ? <div style={{ width: 96, height: 96, borderRadius: "50%", background: "var(--glass)", flexShrink: 0 }} />
            : <Headshot name={name} hue={nameHue(name)} size={96} />
          }
          <div className="grow">
            <div className="eyebrow">Patient record</div>
            <h1 className="h-1" style={{ marginBottom: 6 }}>{loading ? "Loading…" : name}</h1>
            <p className="body">
              {profile?.email}
              {profile?.blood_type ? ` · Blood type ${profile.blood_type}` : ""}
              {profile?.phone ? ` · ${profile.phone}` : ""}
            </p>
          </div>
          <div className="row gap-2">
            {saved && <span className="pill good"><Check size={11} /> Saved</span>}
            <span className="pill good"><ShieldCheck size={11} /> Verified</span>
            {!editing ? (
              <button className="btn btn-glass btn-sm" onClick={() => setEditing(true)}>
                <Edit2 size={13} /> Edit
              </button>
            ) : (
              <button className="btn btn-ghost btn-sm" onClick={cancelEdit}>
                <X size={13} /> Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {editing ? (
        /* Edit form */
        <div className="col gap-4">
          <div className="admin-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div className="glass" style={{ padding: 24 }}>
              <div className="eyebrow" style={{ marginBottom: 16 }}>Personal info</div>
              <div className="col gap-3">
                <div>
                  <div className="tiny" style={{ marginBottom: 5, color: "var(--ink-3)" }}>Full name</div>
                  <input style={inputStyle} value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
                </div>
                <div>
                  <div className="tiny" style={{ marginBottom: 5, color: "var(--ink-3)" }}>Phone</div>
                  <input style={inputStyle} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1 555 000 0000" />
                </div>
                <div>
                  <div className="tiny" style={{ marginBottom: 5, color: "var(--ink-3)" }}>Date of birth</div>
                  <input type="date" style={inputStyle} value={form.date_of_birth} onChange={e => setForm(f => ({ ...f, date_of_birth: e.target.value }))} />
                </div>
                <div>
                  <div className="tiny" style={{ marginBottom: 5, color: "var(--ink-3)" }}>Gender</div>
                  <select style={inputStyle} value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                    <option value="">Select…</option>
                    {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <div className="tiny" style={{ marginBottom: 5, color: "var(--ink-3)" }}>Address</div>
                  <input style={inputStyle} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="City, State, Country" />
                </div>
              </div>
            </div>

            <div className="glass" style={{ padding: 24 }}>
              <div className="eyebrow" style={{ marginBottom: 16 }}>Health info</div>
              <div className="col gap-3">
                <div>
                  <div className="tiny" style={{ marginBottom: 5, color: "var(--ink-3)" }}>Blood type</div>
                  <select style={inputStyle} value={form.blood_type} onChange={e => setForm(f => ({ ...f, blood_type: e.target.value }))}>
                    <option value="">Select…</option>
                    {BLOOD_TYPES.map(bt => <option key={bt} value={bt}>{bt}</option>)}
                  </select>
                </div>
                <div>
                  <div className="tiny" style={{ marginBottom: 5, color: "var(--ink-3)" }}>Blood pressure</div>
                  <input style={inputStyle} value={form.health_stats.bp} onChange={e => setForm(f => ({ ...f, health_stats: { ...f.health_stats, bp: e.target.value } }))} placeholder="e.g. 120/80" />
                </div>
                <div>
                  <div className="tiny" style={{ marginBottom: 5, color: "var(--ink-3)" }}>Weight (kg)</div>
                  <input type="number" style={inputStyle} value={form.health_stats.weight} onChange={e => setForm(f => ({ ...f, health_stats: { ...f.health_stats, weight: e.target.value } }))} placeholder="70" />
                </div>
                <div>
                  <div className="tiny" style={{ marginBottom: 5, color: "var(--ink-3)" }}>Height (cm)</div>
                  <input type="number" style={inputStyle} value={form.health_stats.height} onChange={e => setForm(f => ({ ...f, health_stats: { ...f.health_stats, height: e.target.value } }))} placeholder="175" />
                </div>
              </div>
            </div>
          </div>

          <button
            className="btn btn-primary"
            style={{ alignSelf: "flex-end", minWidth: 160, justifyContent: "center" }}
            onClick={saveProfile}
            disabled={saving}
          >
            {saving ? "Saving…" : <><Check size={14} /> Save profile</>}
          </button>
        </div>
      ) : (
        /* View mode */
        <div className="admin-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div className="glass" style={{ padding: 24 }}>
            <div className="eyebrow" style={{ marginBottom: 16 }}>Personal info</div>
            <div className="col gap-3">
              {[
                ["Full name", profile?.full_name],
                ["Email", profile?.email],
                ["Phone", profile?.phone],
                ["Date of birth", profile?.date_of_birth],
                ["Gender", profile?.gender],
                ["Address", profile?.address],
              ].map(([label, value]) => (
                <div key={String(label)} style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid var(--line)" }}>
                  <div className="eyebrow" style={{ marginBottom: 3, fontSize: 10 }}>{label}</div>
                  <div className="small" style={{ fontWeight: 600 }}>{value || <span style={{ color: "var(--ink-3)" }}>Not set</span>}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="col gap-4">
            <div className="glass" style={{ padding: 24 }}>
              <div className="eyebrow" style={{ marginBottom: 16 }}>
                <HeartPulse size={12} style={{ display: "inline", marginRight: 6 }} />
                Health stats
              </div>
              <div className="bento" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
                {[
                  ["Blood type", profile?.blood_type],
                  ["BP", profile?.health_stats?.bp],
                  ["Weight", profile?.health_stats?.weight ? `${profile.health_stats.weight} kg` : null],
                  ["Height", profile?.health_stats?.height ? `${profile.health_stats.height} cm` : null],
                ].map(([label, value]) => (
                  <div key={String(label)} className="glass cell" style={{ textAlign: "center", padding: 14 }}>
                    <div className="eyebrow" style={{ marginBottom: 6, fontSize: 10 }}>{label}</div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{value || <span style={{ color: "var(--ink-3)", fontSize: 14 }}>—</span>}</div>
                  </div>
                ))}
              </div>
            </div>
            <ReminderToggle />
          </div>
        </div>
      )}
    </div>
  );
}
