"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BadgeCheck, Building2, CalendarPlus, Clock, GraduationCap, Languages, MapPin, Star, UserRound } from "lucide-react";
import { Headshot } from "@/components/medflow/Prototype";
import { SaveBar } from "@/components/shared/SaveBar";
import { TagInput } from "@/components/shared/TagInput";
import { useApi, useAuthedFetch } from "@/lib/use-api";
import { CURRENCY, doctorName, formatFee, nameHue } from "@/lib/format";

type Profile = {
  id: string;
  specialty: string;
  consultation_fee: number | null;
  experience_years: number | null;
  bio: string | null;
  is_verified: boolean;
  rating: number | null;
  total_reviews: number | null;
  clinic_name: string | null;
  clinic_address: string | null;
  qualifications: string[] | null;
  languages: string[] | string | null;
  profiles: { full_name: string; email: string } | null;
};

type Form = {
  full_name: string;
  specialty: string;
  experience_years: string;
  consultation_fee: string;
  clinic_name: string;
  clinic_address: string;
  bio: string;
  qualifications: string[];
  languages: string[];
};

const LANGS = ["English", "Hindi", "Urdu", "Kashmiri", "Punjabi", "Bengali", "Tamil", "Telugu", "Marathi"];
const QUALS = ["MBBS", "MD", "MS", "DNB", "DM", "MCh", "BDS", "MDS"];

function toForm(p: Profile): Form {
  const langs = !p.languages ? [] : Array.isArray(p.languages) ? p.languages : p.languages.split(",").map((l) => l.trim()).filter(Boolean);
  return {
    full_name: (p.profiles?.full_name ?? "").replace(/^dr\.?\s+/i, ""),
    specialty: p.specialty ?? "",
    experience_years: p.experience_years === null || p.experience_years === undefined ? "" : String(p.experience_years),
    consultation_fee: p.consultation_fee === null || p.consultation_fee === undefined ? "" : String(Number(p.consultation_fee)),
    clinic_name: p.clinic_name ?? "",
    clinic_address: p.clinic_address ?? "",
    bio: p.bio ?? "",
    qualifications: p.qualifications ?? [],
    languages: langs,
  };
}

const same = (a: Form, b: Form) => JSON.stringify(a) === JSON.stringify(b);

export default function DoctorProfilePage() {
  const { data, loading, error, reload } = useApi<{ profile: Profile }>("/api/doctor/profile");
  const authedFetch = useAuthedFetch();
  const [saved, setSaved] = useState<Form | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [justSaved, setJustSaved] = useState(false);
  const clearSaved = useCallback(() => setJustSaved(false), []);

  useEffect(() => {
    if (data?.profile && !saved) {
      const f = toForm(data.profile);
      setSaved(f);
      setForm(f);
    }
  }, [data, saved]);

  const dirty = useMemo(() => !!form && !!saved && !same(form, saved), [form, saved]);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => (f ? { ...f, [k]: v } : f));
    setJustSaved(false);
  };
  const input = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(k, e.target.value as never);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !dirty) return;
    setSaving(true);
    setSaveError("");
    try {
      await authedFetch("/api/doctor/profile", {
        method: "PATCH",
        body: JSON.stringify({
          full_name: form.full_name,
          specialty: form.specialty,
          experience_years: form.experience_years === "" ? 0 : Number(form.experience_years),
          consultation_fee: form.consultation_fee === "" ? 0 : Number(form.consultation_fee),
          clinic_name: form.clinic_name,
          clinic_address: form.clinic_address,
          bio: form.bio,
          qualifications: form.qualifications,
          languages: form.languages,
        }),
      });
      setSaved(form);
      setJustSaved(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Couldn’t save");
    } finally {
      setSaving(false);
    }
  };

  if (loading || (!form && !error)) {
    return (
      <div className="dr" aria-busy="true">
        <div className="bk-skeleton" style={{ minHeight: 60, borderRadius: 16, maxWidth: 320 }} />
        <div className="bk-skeleton" style={{ minHeight: 480, borderRadius: 24 }} />
      </div>
    );
  }
  if (error || !form || !data) {
    return (
      <div className="bk-empty">
        <p className="h-4">Your profile couldn’t be loaded</p>
        <p className="small">{error}.</p>
        <button type="button" className="btn btn-ghost btn-sm" onClick={reload}>Try again</button>
      </div>
    );
  }

  const p = data.profile;
  const name = doctorName(form.full_name);
  const fee = Number(form.consultation_fee || 0);
  const canSave = !!form.full_name.trim() && !!form.specialty.trim();

  return (
    <form className="dr hp" onSubmit={save} noValidate>
      <header className="dr-head">
        <div className="col" style={{ gap: 4 }}>
          <h1 className="h-1">Your profile</h1>
          <p className="small">This is what patients see when they choose a doctor.</p>
        </div>
        {p.is_verified ? (
          <span className="pay-tag pay-paid"><BadgeCheck size={13} /> Verified by MedFlow</span>
        ) : (
          <span className="pay-tag pay-due">Waiting for verification — you’ll appear in search once approved</span>
        )}
      </header>

      <div className="dp2">
        <div className="col gap-5" style={{ minWidth: 0 }}>
          <section className="hp-card" aria-labelledby="dp-who">
            <h2 id="dp-who" className="hp-title"><UserRound size={16} /> About you</h2>
            <div className="fm-grid">
              <label className="fm-field">
                <span className="mf-label">Name</span>
                <span className="dp-prefix">
                  <span aria-hidden="true">Dr.</span>
                  <input className="input" value={form.full_name} onChange={input("full_name")} aria-invalid={!form.full_name.trim()} autoComplete="name" />
                </span>
              </label>
              <label className="fm-field">
                <span className="mf-label">Specialty</span>
                <input className="input" value={form.specialty} onChange={input("specialty")} placeholder="e.g. Cardiology" aria-invalid={!form.specialty.trim()} />
              </label>
              <label className="fm-field">
                <span className="mf-label">Years of experience</span>
                <input className="input" type="number" min={0} max={70} value={form.experience_years} onChange={input("experience_years")} />
              </label>
              <div className="fm-field">
                <label className="mf-label" htmlFor="dp-quals">Qualifications</label>
                <TagInput id="dp-quals" value={form.qualifications} onChange={(v) => set("qualifications", v)} placeholder="Type and press Enter" suggestions={QUALS} />
              </div>
              <label className="fm-field fm-wide">
                <span className="mf-label">About you</span>
                <textarea className="input" rows={4} maxLength={2000} value={form.bio} onChange={input("bio")} placeholder="What you treat, how you work with patients, and anything that helps them choose you." />
                <span className="tiny">{form.bio.length}/2000</span>
              </label>
              <div className="fm-field fm-wide">
                <label className="mf-label" htmlFor="dp-langs">Languages you consult in</label>
                <TagInput id="dp-langs" value={form.languages} onChange={(v) => set("languages", v)} placeholder="e.g. English" suggestions={LANGS} />
              </div>
            </div>
          </section>

          <section className="hp-card" aria-labelledby="dp-clinic">
            <h2 id="dp-clinic" className="hp-title"><Building2 size={16} /> Clinic and fee</h2>
            <div className="fm-grid">
              <label className="fm-field">
                <span className="mf-label">Clinic or hospital</span>
                <input className="input" value={form.clinic_name} onChange={input("clinic_name")} placeholder="e.g. City Care Clinic" />
              </label>
              <label className="fm-field">
                <span className="mf-label">Consultation fee</span>
                <span className="dp-prefix">
                  <span aria-hidden="true">{formatFee(0).replace(/[\d.,\s]/g, "") || CURRENCY}</span>
                  <input className="input" type="number" min={0} max={100000} value={form.consultation_fee} onChange={input("consultation_fee")} inputMode="numeric" />
                </span>
                <span className="tiny">Patients pay this when they book online. Changes apply to new payments.</span>
              </label>
              <label className="fm-field fm-wide">
                <span className="mf-label">Clinic address</span>
                <input className="input" value={form.clinic_address} onChange={input("clinic_address")} placeholder="Street, area, city" />
              </label>
            </div>
            <Link href="/admin/schedule" className="dp-link"><Clock size={14} /> Set your weekly hours and days off</Link>
          </section>
        </div>

        <aside className="dp2-preview" aria-label="Preview of your card in search">
          <span className="mf-label">How patients see you</span>
          <div className="dl-card">
            <div className="dl-main">
              <Headshot name={name} hue={nameHue(name)} size={56} />
              <span className="col" style={{ gap: 3, minWidth: 0 }}>
                <span className="dl-name">
                  <span className="mf-ellipsis">{name}</span>
                  {p.is_verified && <BadgeCheck size={15} className="dl-verified" />}
                </span>
                <span className="small">{form.specialty || "Your specialty"}{form.experience_years ? ` · ${form.experience_years} yrs` : ""}</span>
                {p.rating && p.total_reviews ? (
                  <span className="dl-rating"><Star size={12} fill="currentColor" strokeWidth={0} /> {Number(p.rating).toFixed(1)} <span className="tiny">({p.total_reviews})</span></span>
                ) : (
                  <span className="tiny">New on MedFlow</span>
                )}
              </span>
            </div>
            {(form.clinic_name || form.languages.length > 0 || form.qualifications.length > 0) && (
              <div className="dl-meta">
                {form.qualifications.length > 0 && <span><GraduationCap size={13} /> {form.qualifications.join(", ")}</span>}
                {form.clinic_name && <span><MapPin size={13} /> {form.clinic_name}</span>}
                {form.languages.length > 0 && <span><Languages size={13} /> {form.languages.join(", ")}</span>}
              </div>
            )}
            {form.bio && <p className="small dp2-bio">{form.bio}</p>}
            <div className="dl-foot">
              <span className="dl-fee">{formatFee(fee)} <span className="tiny">per visit</span></span>
              <span className="btn btn-primary btn-sm" aria-hidden="true"><CalendarPlus size={14} /> Book</span>
            </div>
          </div>
          <p className="tiny">{p.profiles?.email}</p>
        </aside>
      </div>

      <SaveBar
        dirty={dirty}
        saving={saving}
        saved={justSaved}
        error={saveError}
        canSave={canSave}
        onDiscard={() => { setForm(saved); setSaveError(""); }}
        onSavedShown={clearSaved}
      />
    </form>
  );
}
