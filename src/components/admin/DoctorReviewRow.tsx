"use client";

import { useState } from "react";
import { BadgeCheck, EyeOff, Star } from "lucide-react";
import { Headshot } from "@/components/medflow/Prototype";
import { useAuthedFetch } from "@/lib/use-api";
import { doctorName, formatFee, nameHue } from "@/lib/format";

export type AdminDoctor = {
  id: string;
  specialty: string;
  rating: number;
  total_reviews: number;
  consultation_fee: number;
  is_verified: boolean;
  clinic_name: string | null;
  experience_years: number | null;
  created_at: string;
  profiles: { full_name: string; email: string; is_active: boolean } | null;
};

/** A doctor with the verify / hide action, used on the overview and doctors page. */
export function DoctorReviewRow({ doctor, onChanged }: { doctor: AdminDoctor; onChanged: () => void }) {
  const authedFetch = useAuthedFetch();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const name = doctorName(doctor.profiles?.full_name);
  const suspended = doctor.profiles?.is_active === false;

  const set = async (is_verified: boolean) => {
    setBusy(true);
    setError("");
    try {
      await authedFetch("/api/super-admin/doctors", { method: "PATCH", body: JSON.stringify({ doctorId: doctor.id, is_verified }) });
      setConfirming(false);
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="ad-row">
      <Headshot name={name} hue={nameHue(name)} size={40} />
      <div className="col" style={{ gap: 2, minWidth: 0 }}>
        <span className="mf-ellipsis" style={{ fontWeight: 600 }}>
          {name}
          {suspended && <span className="ad-tag bad">Suspended</span>}
        </span>
        <span className="tiny mf-ellipsis">
          {[doctor.specialty, doctor.clinic_name, doctor.experience_years ? `${doctor.experience_years} yrs` : null, formatFee(doctor.consultation_fee)]
            .filter(Boolean)
            .join(" · ")}
        </span>
        <span className="tiny mf-ellipsis">{doctor.profiles?.email}</span>
        {error && <span className="small sc-bad" role="alert">{error}</span>}
      </div>
      <div className="ad-actions">
        {doctor.total_reviews > 0 && (
          <span className="tiny ad-rating">
            <Star size={12} fill="currentColor" strokeWidth={0} /> {Number(doctor.rating).toFixed(1)} ({doctor.total_reviews})
          </span>
        )}
        {doctor.is_verified ? (
          confirming ? (
            <span className="row gap-2">
              <button type="button" className="btn btn-sm vrow-danger" disabled={busy} onClick={() => set(false)}>
                {busy ? "Hiding…" : "Hide doctor"}
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirming(false)}>Keep</button>
            </span>
          ) : (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirming(true)}>
              <EyeOff size={14} /> Hide from search
            </button>
          )
        ) : (
          <button type="button" className="btn btn-primary btn-sm" disabled={busy || suspended} onClick={() => set(true)} title={suspended ? "Reactivate the account first" : undefined}>
            <BadgeCheck size={14} /> {busy ? "Verifying…" : "Verify"}
          </button>
        )}
      </div>
    </li>
  );
}
