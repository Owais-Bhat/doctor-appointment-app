"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Save, Star, Briefcase, DollarSign, FileText } from "lucide-react";

type Profile = {
  id: string;
  specialty: string;
  consultation_fee: number;
  experience_years: number;
  bio: string;
  is_verified: boolean;
  rating: number;
  total_reviews: number;
  profiles: { full_name: string; email: string };
};

export default function DoctorProfilePage() {
  const { user, getToken } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getToken().then(token =>
      fetch("/api/doctor/profile", { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => setProfile(d.profile ?? null))
        .catch(console.error)
        .finally(() => setLoading(false))
    );
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setSaved(false);
    const token = await getToken();
    await fetch("/api/doctor/profile", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        specialty: profile.specialty,
        consultation_fee: profile.consultation_fee,
        experience_years: profile.experience_years,
        bio: profile.bio,
      }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) return <div className="fade-enter col gap-7"><div className="glass small" style={{ padding: 32, textAlign: "center" }}>Loading profile…</div></div>;
  if (!profile) return <div className="fade-enter"><div className="glass small" style={{ padding: 32, textAlign: "center", color: "var(--bad)" }}>Doctor profile not found.</div></div>;

  const fullName = profile.profiles?.full_name ?? "Doctor";
  const email = profile.profiles?.email ?? "";

  return (
    <div className="fade-enter col gap-7">
      <div className="col" style={{ gap: 6 }}>
        <div className="eyebrow">Account settings</div>
        <h1 className="h-1">Profile</h1>
        <p className="body">Update your professional details visible to patients.</p>
      </div>

      <div className="glass" style={{ padding: 24 }}>
        <div className="row gap-4" style={{ marginBottom: 24 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20,
            background: "var(--accent)", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26, fontWeight: 900,
          }}>
            {fullName.charAt(0)}
          </div>
          <div className="col" style={{ gap: 4 }}>
            <div style={{ fontWeight: 800, fontSize: 20 }}>{fullName}</div>
            <div className="small" style={{ color: "var(--ink-3)" }}>{email}</div>
            <div className="row gap-2" style={{ marginTop: 4 }}>
              {profile.is_verified && <span className="pill good">Verified</span>}
              <span className="pill">{profile.rating > 0 ? profile.rating.toFixed(1) : "—"} ★ · {profile.total_reviews} reviews</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="col gap-5">
          <div className="bento" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            <div className="glass cell">
              <div className="row gap-2" style={{ marginBottom: 10, color: "var(--accent)" }}>
                <Star size={14} />
                <span className="eyebrow">Specialty</span>
              </div>
              <input
                className="input"
                value={profile.specialty}
                onChange={e => setProfile({ ...profile, specialty: e.target.value })}
                placeholder="e.g. Cardiology"
                required
              />
            </div>
            <div className="glass cell">
              <div className="row gap-2" style={{ marginBottom: 10, color: "var(--accent)" }}>
                <Briefcase size={14} />
                <span className="eyebrow">Experience (years)</span>
              </div>
              <input
                className="input"
                type="number"
                min={0}
                value={profile.experience_years ?? ""}
                onChange={e => setProfile({ ...profile, experience_years: +e.target.value })}
              />
            </div>
            <div className="glass cell">
              <div className="row gap-2" style={{ marginBottom: 10, color: "var(--accent)" }}>
                <DollarSign size={14} />
                <span className="eyebrow">Consultation fee ($)</span>
              </div>
              <input
                className="input"
                type="number"
                min={0}
                step="0.01"
                value={profile.consultation_fee ?? ""}
                onChange={e => setProfile({ ...profile, consultation_fee: +e.target.value })}
              />
            </div>
          </div>

          <div className="glass cell">
            <div className="row gap-2" style={{ marginBottom: 10, color: "var(--accent)" }}>
              <FileText size={14} />
              <span className="eyebrow">Professional bio</span>
            </div>
            <textarea
              className="input"
              rows={5}
              style={{ resize: "vertical" }}
              value={profile.bio ?? ""}
              onChange={e => setProfile({ ...profile, bio: e.target.value })}
              placeholder="Tell patients about your background and approach…"
            />
          </div>

          <div className="row" style={{ justifyContent: "flex-end", gap: 12 }}>
            {saved && <span className="small" style={{ color: "var(--good)", alignSelf: "center" }}>Saved</span>}
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={14} /> {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
