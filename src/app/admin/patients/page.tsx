"use client";

import { useMemo, useState } from "react";
import { Mail, Phone, Search } from "lucide-react";
import { Headshot } from "@/components/medflow/Prototype";
import { useApi } from "@/lib/use-api";
import { STATUS_LABEL, formatDay, nameHue } from "@/lib/format";
import { cn } from "@/lib/utils";

type PatientRow = {
  patient_id: string;
  status: string;
  appointment_date: string;
  chief_complaint: string | null;
  profiles: {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    blood_type: string | null;
    date_of_birth: string | null;
    health_stats: Record<string, unknown> | null;
  } | null;
};

function age(dob: string | null) {
  if (!dob) return null;
  const d = new Date(`${dob}T00:00:00`);
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) a--;
  return a >= 0 && a < 130 ? a : null;
}

/** Health fields patients fill in on their profile, shown when present. */
const HEALTH_FIELDS: [string, string][] = [
  ["allergies", "Allergies"],
  ["chronic_conditions", "Conditions"],
  ["medications", "Medications"],
  ["bp", "Blood pressure"],
  ["weight", "Weight"],
  ["height", "Height"],
];

function Details({ row }: { row: PatientRow }) {
  const p = row.profiles;
  if (!p) return null;
  const years = age(p.date_of_birth);
  const health = HEALTH_FIELDS.filter(([k]) => p.health_stats?.[k]).map(([k, label]) => [label, String(p.health_stats![k])]);

  return (
    <div className="pt-detail">
      <div className="row gap-3" style={{ alignItems: "center" }}>
        <Headshot name={p.full_name} hue={nameHue(p.full_name)} size={56} />
        <div className="col" style={{ gap: 2, minWidth: 0 }}>
          <h2 className="h-3 mf-ellipsis">{p.full_name}</h2>
          <span className="small">
            {[years !== null ? `${years} years` : null, p.blood_type ? `Blood ${p.blood_type}` : null].filter(Boolean).join(" · ") || "No age or blood type on file"}
          </span>
        </div>
      </div>

      <div className="row gap-2 wrap">
        {p.phone && (
          <a className="btn btn-ghost btn-sm" href={`tel:${p.phone.replace(/\s/g, "")}`}>
            <Phone size={14} /> {p.phone}
          </a>
        )}
        {p.email && (
          <a className="btn btn-ghost btn-sm" href={`mailto:${p.email}`}>
            <Mail size={14} /> Email
          </a>
        )}
      </div>

      <dl className="dr-stats">
        <div>
          <dt>Latest visit</dt>
          <dd>
            {formatDay(row.appointment_date)} · {STATUS_LABEL[row.status] ?? row.status}
          </dd>
        </div>
        {row.chief_complaint && (
          <div>
            <dt>Reason</dt>
            <dd className="pt-wrap">{row.chief_complaint}</dd>
          </div>
        )}
        {health.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd className="pt-wrap">{value}</dd>
          </div>
        ))}
      </dl>
      {health.length === 0 && <p className="tiny">The patient hasn’t added allergies or conditions to their health profile.</p>}
    </div>
  );
}

export default function PatientsPage() {
  const { data, loading, error, reload } = useApi<{ patients: PatientRow[] }>("/api/doctor/patients");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const rows = useMemo(() => (data?.patients ?? []).filter((r) => r.profiles), [data]);
  const filtered = rows.filter((r) =>
    `${r.profiles?.full_name} ${r.profiles?.phone ?? ""} ${r.chief_complaint ?? ""}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const selected = filtered.find((r) => r.patient_id === selectedId) ?? filtered[0] ?? null;

  return (
    <div className="dr">
      <header className="dr-head">
        <div className="col gap-2">
          <h1 className="h-1">Patients</h1>
          <p className="body">{loading ? "Loading…" : `${rows.length} ${rows.length === 1 ? "person has" : "people have"} booked with you.`}</p>
        </div>
      </header>

      {loading ? (
        <div className="bk-skeleton" style={{ minHeight: 280, borderRadius: 18 }} aria-busy="true" />
      ) : error ? (
        <div className="bk-empty">
          <p className="h-4">Patients could not be loaded</p>
          <button type="button" className="btn btn-ghost btn-sm" onClick={reload}>Try again</button>
        </div>
      ) : rows.length === 0 ? (
        <div className="bk-empty">
          <p className="h-4">No patients yet</p>
          <p className="small">Everyone who books a visit with you will be listed here with their health details.</p>
        </div>
      ) : (
        <div className="dr-grid">
          <section className="col gap-3" style={{ minWidth: 0 }} aria-label="Patient list">
            <label className="search">
              <Search size={16} className="mf-muted" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, phone or reason" aria-label="Search patients" />
            </label>
            {filtered.length === 0 ? (
              <p className="small">No patients match “{query}”.</p>
            ) : (
              <ul className="pt-list">
                {filtered.map((r) => {
                  const p = r.profiles!;
                  const on = selected?.patient_id === r.patient_id;
                  return (
                    <li key={r.patient_id}>
                      <button type="button" className={cn("pt-row", on && "on")} onClick={() => setSelectedId(r.patient_id)} aria-expanded={on}>
                        <Headshot name={p.full_name} hue={nameHue(p.full_name)} size={40} />
                        <span className="col" style={{ gap: 1, minWidth: 0 }}>
                          <span className="mf-ellipsis" style={{ fontWeight: 600 }}>{p.full_name}</span>
                          <span className="tiny mf-ellipsis">{r.chief_complaint ?? "No reason given"}</span>
                        </span>
                        <span className="tiny pt-last">{formatDay(r.appointment_date)}</span>
                      </button>
                      {/* On mobile the details open under the selected row */}
                      {on && (
                        <div className="pt-inline">
                          <Details row={r} />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {selected && (
            <aside className="pt-side glass-strong" aria-label="Patient details">
              <Details row={selected} />
            </aside>
          )}
        </div>
      )}
    </div>
  );
}
