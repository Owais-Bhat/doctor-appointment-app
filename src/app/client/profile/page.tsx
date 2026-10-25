"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Check, HeartPulse, PhoneCall, Stethoscope, UserRound } from "lucide-react";
import { Headshot } from "@/components/medflow/Prototype";
import { ReminderToggle } from "@/components/shared/ReminderToggle";
import { SaveBar } from "@/components/shared/SaveBar";
import { useApi, useAuthedFetch } from "@/lib/use-api";
import { nameHue } from "@/lib/format";

type Health = {
  allergies?: string | null;
  chronic_conditions?: string | null;
  medications?: string | null;
  bp?: string | null;
  weight?: number | null;
  height?: number | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
};
type Profile = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  blood_type: string | null;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
  health_stats: Health | null;
};

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENDERS = ["Male", "Female", "Non-binary", "Prefer not to say"];

type Form = Record<
  | "full_name" | "phone" | "date_of_birth" | "gender" | "address" | "blood_type"
  | "allergies" | "chronic_conditions" | "medications" | "bp" | "weight" | "height"
  | "emergency_contact_name" | "emergency_contact_phone",
  string
>;

function toForm(p: Profile): Form {
  const h = p.health_stats ?? {};
  const s = (v: unknown) => (v === null || v === undefined ? "" : String(v));
  return {
    full_name: s(p.full_name), phone: s(p.phone), date_of_birth: s(p.date_of_birth),
    gender: GENDERS.find((g) => g.toLowerCase() === s(p.gender).toLowerCase()) ?? s(p.gender),
    address: s(p.address), blood_type: s(p.blood_type),
    allergies: s(h.allergies), chronic_conditions: s(h.chronic_conditions), medications: s(h.medications),
    bp: s(h.bp), weight: s(h.weight), height: s(h.height),
    emergency_contact_name: s(h.emergency_contact_name), emergency_contact_phone: s(h.emergency_contact_phone),
  };
}

function age(dob: string) {
  if (!dob) return null;
  const d = new Date(`${dob}T00:00:00`);
  const n = new Date();
  let a = n.getFullYear() - d.getFullYear();
  if (n < new Date(n.getFullYear(), d.getMonth(), d.getDate())) a--;
  return a >= 0 && a < 130 ? a : null;
}

/** The fields that make a visit go smoother; drives the "x% complete" ring. */
const KEY_FIELDS: (keyof Form)[] = ["phone", "date_of_birth", "gender", "blood_type", "allergies", "emergency_contact_name", "emergency_contact_phone"];

function Field({ label, hint, children, wide }: { label: string; hint?: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <label className={wide ? "fm-field fm-wide" : "fm-field"}>
      <span className="mf-label">{label}</span>
      {children}
      {hint && <span className="tiny">{hint}</span>}
    </label>
  );
}

export default function ClientProfile() {
  const { data, loading, error, reload } = useApi<{ profile: Profile }>("/api/patient/profile");
  const authedFetch = useAuthedFetch();
  const reduce = useReducedMotion();
  const [saved, setSaved] = useState<Form | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (data?.profile && !saved) {
      const f = toForm(data.profile);
      setSaved(f);
      setForm(f);
    }
  }, [data, saved]);

  const dirty = useMemo(() => !!form && !!saved && (Object.keys(form) as (keyof Form)[]).some((k) => form[k] !== saved[k]), [form, saved]);
  const done = form ? KEY_FIELDS.filter((k) => form[k].trim()).length : 0;
  const pct = Math.round((done / KEY_FIELDS.length) * 100);

  const clearSaved = useCallback(() => setJustSaved(false), []);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((f) => (f ? { ...f, [k]: e.target.value } : f));
    setJustSaved(false);
  };

  const save = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!form) return;
    setSaving(true);
    setSaveError("");
    try {
      const res = await authedFetch<{ profile: Profile }>("/api/patient/profile", {
        method: "PATCH",
        body: JSON.stringify({
          full_name: form.full_name,
          phone: form.phone || null,
          date_of_birth: form.date_of_birth || null,
          gender: form.gender || null,
          address: form.address || null,
          blood_type: form.blood_type || null,
          health_stats: {
            allergies: form.allergies || null,
            chronic_conditions: form.chronic_conditions || null,
            medications: form.medications || null,
            bp: form.bp || null,
            weight: form.weight || null,
            height: form.height || null,
            emergency_contact_name: form.emergency_contact_name || null,
            emergency_contact_phone: form.emergency_contact_phone || null,
          },
        }),
      });
      const f = toForm(res.profile);
      setSaved(f);
      setForm(f);
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
        <div className="bk-skeleton" style={{ minHeight: 150, borderRadius: 24 }} />
        <div className="bk-skeleton" style={{ minHeight: 420, borderRadius: 24 }} />
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

  const name = form.full_name || "You";
  const years = age(form.date_of_birth);
  const r = 22;
  const circ = 2 * Math.PI * r;

  return (
    <form className="dr hp" onSubmit={save} noValidate>
      <header className="hp-head glass-strong">
        <Headshot name={name} hue={nameHue(name)} size={72} />
        <div className="col" style={{ gap: 4, minWidth: 0 }}>
          <h1 className="h-2 mf-ellipsis">{saved?.full_name || "Your profile"}</h1>
          <p className="small mf-ellipsis">
            {[data.profile.email, years !== null ? `${years} yrs` : null, saved?.blood_type ? `Blood ${saved.blood_type}` : null].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="hp-ring" aria-label={`Profile ${pct}% complete`}>
          <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true">
            <circle cx="28" cy="28" r={r} fill="none" stroke="var(--line-2)" strokeWidth="5" />
            <motion.circle
              cx="28" cy="28" r={r} fill="none" stroke={pct === 100 ? "var(--good)" : "var(--accent)"} strokeWidth="5" strokeLinecap="round"
              strokeDasharray={circ} transform="rotate(-90 28 28)"
              initial={false} animate={{ strokeDashoffset: circ * (1 - pct / 100) }} transition={{ duration: reduce ? 0 : 0.6, ease: [0.2, 0.8, 0.2, 1] }}
            />
          </svg>
          <span className="hp-pct">{pct === 100 ? <Check size={18} /> : `${pct}%`}</span>
          <span className="tiny hp-ring-txt">{pct === 100 ? "Profile complete" : "Complete your profile so doctors have what they need"}</span>
        </div>
      </header>

      <div className="hp-grid">
        <section className="hp-card" aria-labelledby="hp-about">
          <h2 id="hp-about" className="hp-title"><UserRound size={16} /> About you</h2>
          <div className="fm-grid">
            <Field label="Full name" wide>
              <input className="input" value={form.full_name} onChange={set("full_name")} autoComplete="name" required aria-invalid={!form.full_name.trim()} />
            </Field>
            <Field label="Mobile number" hint="For visit reminders and the doctor">
              <input className="input" type="tel" value={form.phone} onChange={set("phone")} autoComplete="tel" placeholder="+91 98765 43210" />
            </Field>
            <Field label="Date of birth">
              <input className="input" type="date" value={form.date_of_birth} onChange={set("date_of_birth")} max={new Date().toISOString().slice(0, 10)} autoComplete="bday" />
            </Field>
            <Field label="Gender">
              <select className="input" value={form.gender} onChange={set("gender")}>
                <option value="">Select</option>
                {GENDERS.map((g) => <option key={g}>{g}</option>)}
              </select>
            </Field>
            <Field label="City or address">
              <input className="input" value={form.address} onChange={set("address")} autoComplete="address-level2" placeholder="Srinagar, J&K" />
            </Field>
          </div>
        </section>

        <section className="hp-card" aria-labelledby="hp-med">
          <h2 id="hp-med" className="hp-title"><Stethoscope size={16} /> Medical details</h2>
          <p className="tiny" style={{ marginTop: -6 }}>Your doctor sees this before each visit.</p>
          <div className="fm-grid">
            <Field label="Blood type">
              <select className="input" value={form.blood_type} onChange={set("blood_type")}>
                <option value="">Not sure</option>
                {BLOOD_TYPES.map((b) => <option key={b}>{b}</option>)}
              </select>
            </Field>
            <Field label="Blood pressure">
              <input className="input" value={form.bp} onChange={set("bp")} placeholder="120/80" inputMode="numeric" />
            </Field>
            <Field label="Weight (kg)">
              <input className="input" type="number" min={1} max={400} step="0.1" value={form.weight} onChange={set("weight")} placeholder="70" />
            </Field>
            <Field label="Height (cm)">
              <input className="input" type="number" min={30} max={260} value={form.height} onChange={set("height")} placeholder="172" />
            </Field>
            <Field label="Allergies" hint="Medicines, food or anything else. Write “None” if you have none." wide>
              <input className="input" value={form.allergies} onChange={set("allergies")} placeholder="e.g. Penicillin, peanuts" maxLength={300} />
            </Field>
            <Field label="Ongoing conditions" wide>
              <input className="input" value={form.chronic_conditions} onChange={set("chronic_conditions")} placeholder="e.g. Diabetes, asthma" maxLength={300} />
            </Field>
            <Field label="Medicines you take" wide>
              <textarea className="input" rows={2} value={form.medications} onChange={set("medications")} placeholder="Name and dose, e.g. Metformin 500 mg twice a day" maxLength={300} />
            </Field>
          </div>
        </section>

        <div className="col gap-5">
          <section className="hp-card" aria-labelledby="hp-sos">
            <h2 id="hp-sos" className="hp-title"><PhoneCall size={16} /> Emergency contact</h2>
            <div className="fm-grid">
              <Field label="Name" wide>
                <input className="input" value={form.emergency_contact_name} onChange={set("emergency_contact_name")} placeholder="e.g. Rafiq Bhat (father)" maxLength={80} />
              </Field>
              <Field label="Phone" wide>
                <input className="input" type="tel" value={form.emergency_contact_phone} onChange={set("emergency_contact_phone")} placeholder="+91 …" maxLength={20} />
              </Field>
            </div>
          </section>
          <ReminderToggle />
          <p className="tiny hp-privacy"><HeartPulse size={13} /> Only you and the doctors you book with can see your medical details.</p>
        </div>
      </div>

      <SaveBar
        dirty={dirty}
        saving={saving}
        saved={justSaved}
        error={saveError}
        canSave={!!form.full_name.trim()}
        onDiscard={() => { setForm(saved); setSaveError(""); }}
        onSavedShown={clearSaved}
      />
    </form>
  );
}
