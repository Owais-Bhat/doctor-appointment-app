"use client";

import { useState } from "react";
import { FormError, PasswordField } from "@/components/auth/AuthShell";
import { useAuthedFetch } from "@/lib/use-api";
import { CURRENCY } from "@/lib/format";
import { SPECIALTIES } from "@/lib/specialties";

const EMPTY = { fullName: "", email: "", password: "", specialty: SPECIALTIES[0], fee: "500", registrationNumber: "", registrationCouncil: "" };

/** Create a doctor's sign-in and verified profile in one step. The admin gives the doctor the password. */
export function AddDoctorForm({ onAdded, onCancel }: { onAdded: (message: string) => void; onCancel: () => void }) {
  const authedFetch = useAuthedFetch();
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (key: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));
  const tooShort = form.password.length > 0 && form.password.length < 8;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim()) return setError("Enter the doctor’s name.");
    if (form.password.length < 8) return setError("Use at least 8 characters for the password.");
    setBusy(true);
    setError("");
    try {
      const res = await authedFetch<{ existing: boolean }>("/api/super-admin/doctors", {
        method: "POST",
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          password: form.password,
          specialty: form.specialty,
          consultationFee: form.fee === "" ? undefined : Number(form.fee),
          registrationNumber: form.registrationNumber,
          registrationCouncil: form.registrationCouncil,
        }),
      });
      const email = form.email.trim().toLowerCase();
      onAdded(
        res.existing
          ? `${email} already had a sign-in, so its password was not changed. The account is now a verified doctor.`
          : `Doctor added. They can sign in with ${email} and the password you set, then change it with “Forgot password”.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="hp-card" onSubmit={onSubmit} noValidate aria-label="Add a doctor">
      <p className="small">
        This creates the doctor’s sign-in and a verified profile, so patients can book them as soon as they set their hours. Share the password with them yourself.
      </p>
      <div className="fm-grid">
        <label className="fm-field">
          <span className="mf-label">Full name</span>
          <input className="input" value={form.fullName} onChange={set("fullName")} autoComplete="off" required />
        </label>
        <label className="fm-field">
          <span className="mf-label">Email</span>
          <input className="input" type="email" value={form.email} onChange={set("email")} autoComplete="off" required />
        </label>
        <div className="fm-field">
          <PasswordField
            label="Password"
            autoComplete="new-password"
            required
            minLength={8}
            value={form.password}
            onChange={set("password")}
            aria-invalid={tooShort}
            hint={tooShort ? `${8 - form.password.length} more characters` : "At least 8 characters"}
          />
        </div>
        <label className="fm-field">
          <span className="mf-label">Specialty</span>
          <select className="input" value={form.specialty} onChange={set("specialty")}>
            {SPECIALTIES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <label className="fm-field">
          <span className="mf-label">Consultation fee ({CURRENCY})</span>
          <input className="input" inputMode="decimal" value={form.fee} onChange={(e) => setForm((f) => ({ ...f, fee: e.target.value.replace(/[^\d.]/g, "") }))} />
        </label>
        <label className="fm-field">
          <span className="mf-label">Medical registration number (optional)</span>
          <input className="input" value={form.registrationNumber} onChange={set("registrationNumber")} maxLength={40} />
        </label>
        <label className="fm-field fm-wide">
          <span className="mf-label">Registration council (optional)</span>
          <input className="input" value={form.registrationCouncil} onChange={set("registrationCouncil")} maxLength={100} placeholder="e.g. Delhi Medical Council" />
        </label>
      </div>
      <FormError message={error} />
      <div className="row gap-2">
        <button type="submit" className="btn btn-primary btn-sm" disabled={busy || !form.fullName || !form.email || !form.password}>
          {busy ? "Adding…" : "Add doctor"}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel} disabled={busy}>Cancel</button>
      </div>
    </form>
  );
}
