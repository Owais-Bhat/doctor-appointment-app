"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, CalendarPlus, Languages, MapPin, ShieldCheck, Star } from "lucide-react";
import { Headshot } from "@/components/medflow/Prototype";
import { useApi } from "@/lib/use-api";
import { doctorName, formatFee, nameHue } from "@/lib/format";

type Doctor = {
  id: string;
  specialty: string;
  bio: string | null;
  qualifications: string[] | null;
  experience_years: number | null;
  consultation_fee: number;
  rating: number;
  total_reviews: number;
  is_verified: boolean;
  clinic_name: string | null;
  clinic_address?: string | null;
  registration_number?: string | null;
  registration_council?: string | null;
  languages: string[] | string | null;
  profiles: { full_name: string } | null;
};

export default function DoctorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, loading, error } = useApi<{ doctor: Doctor }>(`/api/doctors/${id}`, { auth: false });
  const doctor = data?.doctor;

  if (loading) {
    return <div className="dp glass-strong bk-skeleton" style={{ minHeight: 260 }} aria-busy="true" />;
  }

  if (error || !doctor) {
    return (
      <div className="bk-empty">
        <p className="h-4">This doctor isn’t available</p>
        <p className="small">They may have stopped taking bookings on MedFlow.</p>
        <Link href="/client/doctors" className="btn btn-ghost btn-sm">See other doctors</Link>
      </div>
    );
  }

  const name = doctorName(doctor.profiles?.full_name);
  const languages = Array.isArray(doctor.languages)
    ? doctor.languages
    : (doctor.languages ?? "").split(",").map((l) => l.trim()).filter(Boolean);

  const facts = [
    { label: "Experience", value: doctor.experience_years ? `${doctor.experience_years} years` : "—" },
    {
      label: "Rating",
      value: doctor.total_reviews > 0 ? `${Number(doctor.rating).toFixed(1)} (${doctor.total_reviews} reviews)` : "No reviews yet",
    },
    { label: "Consultation", value: formatFee(doctor.consultation_fee) },
  ];

  return (
    <div className="dp">
      <Link href="/client/doctors" className="bk-back">
        <ArrowLeft size={15} /> All doctors
      </Link>

      <section className="dp-hero glass-strong">
        <Headshot name={name} hue={nameHue(name)} size={88} />
        <div className="col gap-2" style={{ minWidth: 0 }}>
          <h1 className="h-2">{name}</h1>
          <p className="body">
            {doctor.specialty}
            {doctor.qualifications?.length ? ` · ${doctor.qualifications.join(", ")}` : ""}
          </p>
          <div className="row gap-2 wrap">
            {doctor.is_verified && (
              <span className="pill good">
                <BadgeCheck size={13} /> Verified by MedFlow
              </span>
            )}
            {doctor.total_reviews > 0 && (
              <span className="pill">
                <Star size={12} fill="currentColor" strokeWidth={0} style={{ color: "var(--warn)" }} />
                {Number(doctor.rating).toFixed(1)}
              </span>
            )}
          </div>
        </div>
        <Link href={`/client/book?doctor=${doctor.id}`} className="btn btn-primary dp-cta">
          <CalendarPlus size={15} /> Book a visit
        </Link>
      </section>

      <dl className="dp-facts">
        {facts.map((f) => (
          <div key={f.label}>
            <dt>{f.label}</dt>
            <dd>{f.value}</dd>
          </div>
        ))}
      </dl>

      <div className="dp-grid">
        {doctor.bio && (
          <section className="col gap-2">
            <h2 className="h-4">About</h2>
            <p className="body">{doctor.bio}</p>
          </section>
        )}
        <section className="col gap-3">
          {doctor.clinic_name && (
            <p className="dp-line">
              <MapPin size={16} /> {doctor.clinic_name}{doctor.clinic_address ? `, ${doctor.clinic_address}` : ""}
            </p>
          )}
          {languages.length > 0 && (
            <p className="dp-line">
              <Languages size={16} /> Speaks {languages.join(", ")}
            </p>
          )}
          {doctor.registration_number && (
            <p className="dp-line">
              <ShieldCheck size={16} /> Reg. no. {doctor.registration_number}{doctor.registration_council ? `, ${doctor.registration_council}` : ""}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
