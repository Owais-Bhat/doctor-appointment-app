"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { BadgeCheck, CalendarPlus, Languages, MapPin, Search, Star } from "lucide-react";
import { Headshot } from "@/components/medflow/Prototype";
import { useApi } from "@/lib/use-api";
import { doctorName, formatFee, nameHue } from "@/lib/format";
import { cn } from "@/lib/utils";

type Doctor = {
  id: string;
  specialty: string;
  bio: string | null;
  rating: number | null;
  total_reviews: number | null;
  consultation_fee: number;
  experience_years: number | null;
  clinic_name: string | null;
  languages: string[] | string | null;
  is_verified?: boolean;
  profiles: { full_name: string } | null;
};

const SORTS = {
  rating: { label: "Top rated", fn: (a: Doctor, b: Doctor) => (b.rating ?? 0) - (a.rating ?? 0) || (b.total_reviews ?? 0) - (a.total_reviews ?? 0) },
  fee: { label: "Lowest fee", fn: (a: Doctor, b: Doctor) => Number(a.consultation_fee) - Number(b.consultation_fee) },
  experience: { label: "Most experienced", fn: (a: Doctor, b: Doctor) => (b.experience_years ?? 0) - (a.experience_years ?? 0) },
} as const;
type SortKey = keyof typeof SORTS;

function langs(d: Doctor): string[] {
  if (!d.languages) return [];
  return Array.isArray(d.languages) ? d.languages : d.languages.split(",").map((l) => l.trim()).filter(Boolean);
}

export default function DoctorsPage() {
  const { data, loading, error, reload } = useApi<{ doctors: Doctor[] }>("/api/doctors", { auth: false });
  const reduce = useReducedMotion();
  const [query, setQuery] = useState("");
  const [specialty, setSpecialty] = useState<string | null>(null);
  const [language, setLanguage] = useState("");
  const [sort, setSort] = useState<SortKey>("rating");

  const doctors = useMemo(() => data?.doctors ?? [], [data]);
  const specialties = useMemo(() => Array.from(new Set(doctors.map((d) => d.specialty).filter(Boolean))).sort(), [doctors]);
  const languages = useMemo(() => Array.from(new Set(doctors.flatMap(langs))).sort(), [doctors]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return doctors
      .filter((d) => !specialty || d.specialty === specialty)
      .filter((d) => !language || langs(d).includes(language))
      .filter((d) => !q || `${d.profiles?.full_name ?? ""} ${d.specialty} ${d.clinic_name ?? ""} ${d.bio ?? ""}`.toLowerCase().includes(q))
      .sort(SORTS[sort].fn);
  }, [doctors, specialty, language, query, sort]);

  const filtered = !!(query || specialty || language);

  return (
    <div className="dr">
      <header className="dr-head">
        <div className="col" style={{ gap: 4 }}>
          <h1 className="h-1">Find a doctor</h1>
          <p className="small">{loading ? "Loading doctors…" : `${doctors.length} verified doctor${doctors.length === 1 ? "" : "s"} across ${specialties.length} specialt${specialties.length === 1 ? "y" : "ies"}.`}</p>
        </div>
      </header>

      <div className="dl-tools">
        <label className="search dl-search">
          <Search size={16} aria-hidden="true" style={{ color: "var(--ink-3)" }} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, clinic or problem" aria-label="Search doctors" />
        </label>
        <div className="dl-selects">
          {languages.length > 1 && (
            <select className="input dl-select" value={language} onChange={(e) => setLanguage(e.target.value)} aria-label="Language">
              <option value="">Any language</option>
              {languages.map((l) => <option key={l}>{l}</option>)}
            </select>
          )}
          <select className="input dl-select" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Sort by">
            {(Object.keys(SORTS) as SortKey[]).map((k) => <option key={k} value={k}>{SORTS[k].label}</option>)}
          </select>
        </div>
      </div>

      {specialties.length > 1 && (
        <div className="bk-chips" role="group" aria-label="Filter by specialty">
          <button type="button" className={cn("bk-chip", !specialty && "on")} aria-pressed={!specialty} onClick={() => setSpecialty(null)}>All</button>
          {specialties.map((s) => (
            <button key={s} type="button" className={cn("bk-chip", specialty === s && "on")} aria-pressed={specialty === s} onClick={() => setSpecialty(specialty === s ? null : s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="dl-grid" aria-busy="true">
          {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="bk-skeleton" style={{ minHeight: 220, borderRadius: 22 }} />)}
        </div>
      ) : error ? (
        <div className="bk-empty">
          <p className="h-4">Doctors couldn’t be loaded</p>
          <p className="small">{error}.</p>
          <button type="button" className="btn btn-ghost btn-sm" onClick={reload}>Try again</button>
        </div>
      ) : list.length === 0 ? (
        <div className="bk-empty">
          <p className="h-4">{filtered ? "No doctors match" : "No doctors yet"}</p>
          <p className="small">{filtered ? "Try another specialty or language, or clear the search." : "Doctors appear here once the clinic verifies them."}</p>
          {filtered && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setQuery(""); setSpecialty(null); setLanguage(""); }}>Clear filters</button>
          )}
        </div>
      ) : (
        <ul className="dl-grid">
          {list.map((d, i) => {
            const name = doctorName(d.profiles?.full_name);
            const l = langs(d);
            return (
              <motion.li
                key={d.id}
                className="dl-card"
                layout={!reduce}
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: reduce ? 0 : Math.min(i, 8) * 0.04 }}
              >
                <Link href={`/client/doctors/${d.id}`} className="dl-main" aria-label={`${name}, ${d.specialty}. View profile`}>
                  <Headshot name={name} hue={nameHue(name)} size={56} />
                  <span className="col" style={{ gap: 3, minWidth: 0 }}>
                    <span className="dl-name">
                      <span className="mf-ellipsis">{name}</span>
                      {d.is_verified !== false && <BadgeCheck size={15} className="dl-verified" aria-label="Verified" />}
                    </span>
                    <span className="small">{d.specialty}{d.experience_years ? ` · ${d.experience_years} yrs` : ""}</span>
                    {d.rating && d.total_reviews ? (
                      <span className="dl-rating"><Star size={12} fill="currentColor" strokeWidth={0} /> {Number(d.rating).toFixed(1)} <span className="tiny">({d.total_reviews})</span></span>
                    ) : (
                      <span className="tiny">New on MedFlow</span>
                    )}
                  </span>
                </Link>
                {(d.clinic_name || l.length > 0) && (
                  <div className="dl-meta">
                    {d.clinic_name && <span><MapPin size={13} /> {d.clinic_name}</span>}
                    {l.length > 0 && <span><Languages size={13} /> {l.join(", ")}</span>}
                  </div>
                )}
                <div className="dl-foot">
                  <span className="dl-fee">{formatFee(d.consultation_fee)} <span className="tiny">per visit</span></span>
                  <Link href={`/client/book?doctor=${d.id}`} className="btn btn-primary btn-sm"><CalendarPlus size={14} /> Book</Link>
                </div>
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
