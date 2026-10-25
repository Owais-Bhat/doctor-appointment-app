"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarCheck,
  Check,
  Languages,
  MapPin,
  Phone,
  Search,
  Star,
  Video,
  type LucideIcon,
} from "lucide-react";
import { Headshot } from "@/components/medflow/Prototype";
import { useAuth } from "@/context/AuthContext";
import { useApi, useAuthedFetch } from "@/lib/use-api";
import {
  VISIT_TYPE_LABEL,
  doctorName,
  formatDay,
  formatFee,
  formatTime,
  nameHue,
  onDay,
  parseISODate,
  toISODate,
} from "@/lib/format";
import { cn } from "@/lib/utils";

type Doctor = {
  id: string;
  specialty: string;
  bio: string | null;
  experience_years: number | null;
  consultation_fee: number;
  rating: number;
  total_reviews: number;
  clinic_name: string | null;
  languages: string[] | string | null;
  profiles: { full_name: string; avatar_url: string | null } | null;
};

type VisitType = "video" | "phone" | "in_person";
type Step = 1 | 2 | 3;

const STEPS: { n: Step; label: string }[] = [
  { n: 1, label: "Doctor" },
  { n: 2, label: "Time" },
  { n: 3, label: "Confirm" },
];

const VISIT_TYPES: { value: VisitType; label: string; icon: LucideIcon }[] = [
  { value: "video", label: "Video", icon: Video },
  { value: "phone", label: "Phone", icon: Phone },
  { value: "in_person", label: "In person", icon: Building2 },
];

const DAYS_AHEAD = 14;

function languagesOf(doc: Doctor): string[] {
  if (!doc.languages) return [];
  return Array.isArray(doc.languages) ? doc.languages : doc.languages.split(",").map((l) => l.trim());
}

function groupSlots(slots: string[]) {
  const groups: { label: string; slots: string[] }[] = [
    { label: "Morning", slots: [] },
    { label: "Afternoon", slots: [] },
    { label: "Evening", slots: [] },
  ];
  for (const s of slots) {
    const h = Number(s.slice(0, 2));
    groups[h < 12 ? 0 : h < 17 ? 1 : 2].slots.push(s);
  }
  return groups.filter((g) => g.slots.length > 0);
}

/* ── Step indicator ──────────────────────────────────────────── */
function Stepper({ step, onJump }: { step: Step; onJump: (s: Step) => void }) {
  return (
    <ol className="bk-steps" aria-label="Booking progress">
      {STEPS.map(({ n, label }) => {
        const done = n < step;
        return (
          <li key={n} className={cn("bk-step", n === step && "current", done && "done")}>
            <button type="button" disabled={!done} onClick={() => onJump(n)} aria-current={n === step ? "step" : undefined}>
              <span className="bk-step-dot">{done ? <Check size={13} strokeWidth={3} /> : n}</span>
              <span>{label}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/* ── Step 1: doctor ──────────────────────────────────────────── */
function DoctorCard({ doc, selected, onSelect }: { doc: Doctor; selected: boolean; onSelect: () => void }) {
  const name = doctorName(doc.profiles?.full_name);
  const langs = languagesOf(doc);
  return (
    <button type="button" className={cn("bk-doctor", selected && "selected")} onClick={onSelect} aria-pressed={selected}>
      <Headshot name={name} hue={nameHue(name)} size={52} />
      <span className="bk-doctor-body">
        <span className="bk-doctor-name">{name}</span>
        <span className="bk-doctor-meta">
          {doc.specialty}
          {doc.experience_years ? ` · ${doc.experience_years} yrs experience` : ""}
        </span>
        {doc.clinic_name && (
          <span className="bk-doctor-line">
            <MapPin size={13} /> {doc.clinic_name}
          </span>
        )}
        {langs.length > 0 && (
          <span className="bk-doctor-line">
            <Languages size={13} /> {langs.slice(0, 3).join(", ")}
          </span>
        )}
      </span>
      <span className="bk-doctor-side">
        <span className="bk-fee">{formatFee(doc.consultation_fee)}</span>
        {doc.total_reviews > 0 ? (
          <span className="bk-rating">
            <Star size={12} fill="currentColor" strokeWidth={0} /> {Number(doc.rating).toFixed(1)}
            <span className="mf-muted"> ({doc.total_reviews})</span>
          </span>
        ) : (
          <span className="tiny">New on MedFlow</span>
        )}
      </span>
    </button>
  );
}

function DoctorStep({
  doctors,
  loading,
  error,
  selectedId,
  onSelect,
}: {
  doctors: Doctor[];
  loading: boolean;
  error: string | null;
  selectedId: string | null;
  onSelect: (d: Doctor) => void;
}) {
  const [query, setQuery] = useState("");
  const [specialty, setSpecialty] = useState<string | null>(null);

  const specialties = useMemo(
    () => Array.from(new Set(doctors.map((d) => d.specialty))).sort(),
    [doctors],
  );

  const filtered = doctors.filter((d) => {
    if (specialty && d.specialty !== specialty) return false;
    const hay = `${d.profiles?.full_name ?? ""} ${d.specialty} ${d.clinic_name ?? ""} ${d.bio ?? ""}`.toLowerCase();
    return hay.includes(query.trim().toLowerCase());
  });

  return (
    <section className="col gap-5" aria-labelledby="bk-step-title">
      <div className="col gap-3">
        <h2 id="bk-step-title" className="h-3">Who would you like to see?</h2>
        <label className="search bk-search">
          <Search size={16} className="mf-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, specialty or symptom"
            aria-label="Search doctors"
          />
        </label>
        {specialties.length > 1 && (
          <div className="bk-chips" role="group" aria-label="Filter by specialty">
            <button type="button" className={cn("bk-chip", !specialty && "on")} onClick={() => setSpecialty(null)}>
              All
            </button>
            {specialties.map((s) => (
              <button
                key={s}
                type="button"
                className={cn("bk-chip", specialty === s && "on")}
                onClick={() => setSpecialty(specialty === s ? null : s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="bk-doctor-grid" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="bk-doctor bk-skeleton" />
          ))}
        </div>
      ) : error ? (
        <div className="bk-empty">
          <p className="h-4">Doctors could not be loaded</p>
          <p className="small">{error}. Refresh the page to try again.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bk-empty">
          <p className="h-4">No doctors match “{query || specialty}”</p>
          <p className="small">Try a specialty like “Cardiology”, or clear the filters.</p>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setQuery("");
              setSpecialty(null);
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="bk-doctor-grid">
          {filtered.map((d) => (
            <DoctorCard key={d.id} doc={d} selected={d.id === selectedId} onSelect={() => onSelect(d)} />
          ))}
        </div>
      )}
    </section>
  );
}

/* ── Step 2: time ────────────────────────────────────────────── */
function TimeStep({
  doctor,
  date,
  setDate,
  slot,
  setSlot,
  visitType,
  setVisitType,
}: {
  doctor: Doctor;
  date: string;
  setDate: (d: string) => void;
  slot: string | null;
  setSlot: (s: string | null) => void;
  visitType: VisitType;
  setVisitType: (v: VisitType) => void;
}) {
  const days = useMemo(() => {
    const out: string[] = [];
    const d = new Date();
    for (let i = 0; i < DAYS_AHEAD; i++) {
      out.push(toISODate(d));
      d.setDate(d.getDate() + 1);
    }
    return out;
  }, []);

  const { data, loading, error } = useApi<{ slots: string[] }>(
    `/api/doctors/${doctor.id}/slots?date=${date}`,
    { auth: false },
  );
  const slots = data?.slots ?? [];
  const groups = groupSlots(slots);

  return (
    <section className="col gap-6" aria-labelledby="bk-step-title">
      <h2 id="bk-step-title" className="h-3">When works for you?</h2>

      <div className="col gap-3">
        <span className="mf-label" id="bk-date-label">Date</span>
        <div className="bk-days no-scrollbar" role="radiogroup" aria-labelledby="bk-date-label">
          {days.map((d) => {
            const dt = parseISODate(d);
            const on = d === date;
            return (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={on}
                className={cn("bk-day", on && "on")}
                onClick={() => {
                  setDate(d);
                  setSlot(null);
                }}
              >
                <span className="bk-day-wd">{dt.toLocaleDateString(undefined, { weekday: "short" })}</span>
                <span className="bk-day-n">{dt.getDate()}</span>
                <span className="bk-day-m">{dt.toLocaleDateString(undefined, { month: "short" })}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="col gap-3" aria-live="polite">
        <span className="mf-label">Time</span>
        {loading ? (
          <div className="bk-slots" aria-busy="true">
            {Array.from({ length: 8 }).map((_, i) => (
              <span key={i} className="bk-slot bk-skeleton" />
            ))}
          </div>
        ) : error ? (
          <p className="small">Times could not be loaded. Pick the date again to retry.</p>
        ) : groups.length === 0 ? (
          <div className="bk-empty bk-empty-inline">
            <p className="h-4">No open times on {formatDay(date)}</p>
            <p className="small">{doctorName(doctor.profiles?.full_name)} isn’t available that day. Try another date.</p>
          </div>
        ) : (
          groups.map((g) => (
            <div key={g.label} className="col gap-2">
              <span className="tiny">{g.label}</span>
              <div className="bk-slots" role="radiogroup" aria-label={`${g.label} times`}>
                {g.slots.map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={slot === s}
                    className={cn("bk-slot", slot === s && "on")}
                    onClick={() => setSlot(s)}
                  >
                    {formatTime(s)}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="col gap-3">
        <span className="mf-label" id="bk-type-label">Visit type</span>
        <div className="bk-segment" role="radiogroup" aria-labelledby="bk-type-label">
          {VISIT_TYPES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={visitType === value}
              className={cn(visitType === value && "on")}
              onClick={() => setVisitType(value)}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Step 3: confirm ─────────────────────────────────────────── */
function ConfirmStep({ reason, setReason }: { reason: string; setReason: (r: string) => void }) {
  return (
    <section className="col gap-5" aria-labelledby="bk-step-title">
      <div className="col gap-2">
        <h2 id="bk-step-title" className="h-3">Anything the doctor should know?</h2>
        <p className="small">Optional. A sentence about your symptoms helps the doctor prepare.</p>
      </div>
      <textarea
        className="input bk-reason"
        value={reason}
        onChange={(e) => setReason(e.target.value.slice(0, 1000))}
        rows={5}
        placeholder="For example: chest tightness when climbing stairs for the past two weeks"
        aria-label="Reason for visit"
      />
      <p className="tiny">
        The clinic confirms your request, usually within a few hours. You’ll get a notification either way.
      </p>
    </section>
  );
}

/* ── Summary (sticky panel on desktop, bottom bar on mobile) ─── */
function Summary({
  doctor,
  date,
  slot,
  visitType,
  step,
  canContinue,
  busy,
  error,
  onContinue,
}: {
  doctor: Doctor | null;
  date: string;
  slot: string | null;
  visitType: VisitType;
  step: Step;
  canContinue: boolean;
  busy: boolean;
  error: string;
  onContinue: () => void;
}) {
  const cta = step === 3 ? (busy ? "Requesting…" : "Request appointment") : "Continue";
  const name = doctor ? doctorName(doctor.profiles?.full_name) : null;

  return (
    <aside className="bk-summary" aria-label="Your appointment">
      <div className="bk-summary-card glass-strong">
        <span className="mf-label">Your appointment</span>
        {doctor && name ? (
          <div className="row gap-3" style={{ alignItems: "center" }}>
            <Headshot name={name} hue={nameHue(name)} size={40} />
            <div className="col" style={{ gap: 0, minWidth: 0 }}>
              <span className="mf-ellipsis" style={{ fontWeight: 600 }}>{name}</span>
              <span className="tiny">{doctor.specialty}</span>
            </div>
          </div>
        ) : (
          <p className="small">Choose a doctor to see open times.</p>
        )}

        {doctor && (
          <dl className="bk-summary-list">
            <div>
              <dt>When</dt>
              <dd>{slot ? `${formatDay(date)}, ${formatTime(slot)}` : "Pick a time"}</dd>
            </div>
            <div>
              <dt>Visit</dt>
              <dd>{VISIT_TYPE_LABEL[visitType]}</dd>
            </div>
            <div>
              <dt>Fee</dt>
              <dd>{formatFee(doctor.consultation_fee)}</dd>
            </div>
          </dl>
        )}

        {error && (
          <p className="bk-error" role="alert">
            {error}
          </p>
        )}

        <button type="button" className="btn btn-primary bk-cta" disabled={!canContinue || busy} onClick={onContinue}>
          {cta}
        </button>
      </div>

      {/* Mobile bottom bar */}
      <div className="bk-bar">
        <div className="col" style={{ gap: 0, minWidth: 0 }}>
          <span className="mf-ellipsis" style={{ fontWeight: 600, fontSize: 14 }}>
            {name ?? "Choose a doctor"}
          </span>
          <span className="tiny mf-ellipsis">
            {doctor
              ? slot
                ? `${formatDay(date)}, ${formatTime(slot)} · ${formatFee(doctor.consultation_fee)}`
                : `${formatFee(doctor.consultation_fee)} · pick a time`
              : "Step 1 of 3"}
          </span>
        </div>
        <button type="button" className="btn btn-primary" disabled={!canContinue || busy} onClick={onContinue}>
          {step === 3 ? (busy ? "Requesting…" : "Request") : "Continue"}
        </button>
      </div>
    </aside>
  );
}

/* ── Done ────────────────────────────────────────────────────── */
function Done({ doctor, date, slot, visitType, appointmentId }: { doctor: Doctor; date: string; slot: string; visitType: VisitType; appointmentId: string | null }) {
  const name = doctorName(doctor.profiles?.full_name);
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headingRef.current?.focus(), []);

  return (
    <section className="bk-done glass-strong" aria-live="polite">
      <span className="bk-done-icon" aria-hidden="true">
        <CalendarCheck size={26} />
      </span>
      <h1 ref={headingRef} tabIndex={-1} className="h-2">
        Appointment requested
      </h1>
      <p className="body">
        {name} will confirm your {VISIT_TYPE_LABEL[visitType].toLowerCase()} {onDay(date)} at {formatTime(slot)}.
        We’ll notify you as soon as they do.
      </p>
      <div className="row gap-3 wrap" style={{ justifyContent: "center" }}>
        <Link href="/client/appointments" className="btn btn-primary">
          View my visits
        </Link>
        {appointmentId && (
          <Link href={`/client/intake/${appointmentId}`} className="btn btn-ghost">
            Add visit details
          </Link>
        )}
      </div>
    </section>
  );
}

/* ── Flow ────────────────────────────────────────────────────── */
export function BookingFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const authedFetch = useAuthedFetch();

  const { data, loading, error } = useApi<{ doctors: Doctor[] }>("/api/doctors", { auth: false });
  const doctors = useMemo(() => data?.doctors ?? [], [data]);

  const [step, setStep] = useState<Step>(1);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [date, setDate] = useState(() => toISODate(new Date()));
  const [slot, setSlot] = useState<string | null>(null);
  const [visitType, setVisitType] = useState<VisitType>("video");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState<{ id: string | null } | null>(null);

  // Arriving from a doctor's profile: /client/book?doctor=<id>
  const preselect = params.get("doctor");
  useEffect(() => {
    if (!preselect || doctor || doctors.length === 0) return;
    const found = doctors.find((d) => d.id === preselect);
    if (found) {
      setDoctor(found);
      setStep(2);
    }
  }, [preselect, doctors, doctor]);

  const goTo = (s: Step) => {
    setStep(s);
    setSubmitError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const selectDoctor = (d: Doctor) => {
    if (d.id !== doctor?.id) setSlot(null);
    setDoctor(d);
  };

  const canContinue = step === 1 ? !!doctor : step === 2 ? !!slot : !!doctor && !!slot && !!user;

  const submit = async () => {
    if (!doctor || !slot) return;
    if (!user) {
      router.push("/auth/login");
      return;
    }
    setBusy(true);
    setSubmitError("");
    try {
      const res = await authedFetch<{ appointment?: { id?: string } }>("/api/appointments", {
        method: "POST",
        body: JSON.stringify({
          doctorId: doctor.id,
          date,
          time: slot,
          consultationType: visitType,
          chiefComplaint: reason.trim() || null,
        }),
      });
      setDone({ id: res.appointment?.id ?? null });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong";
      // The slot was taken while the patient was deciding: send them back to pick another
      if (/not available|just booked/i.test(message)) {
        setSlot(null);
        setStep(2);
        setSubmitError("That time was just taken. Please pick another.");
      } else {
        setSubmitError(`${message}. Please try again.`);
      }
    } finally {
      setBusy(false);
    }
  };

  const onContinue = () => {
    if (step === 1) goTo(2);
    else if (step === 2) goTo(3);
    else submit();
  };

  if (done && doctor && slot) {
    return <Done doctor={doctor} date={date} slot={slot} visitType={visitType} appointmentId={done.id} />;
  }

  return (
    <div className="bk">
      <div className="bk-head">
        <div className="col gap-2">
          {step > 1 && (
            <button type="button" className="bk-back" onClick={() => goTo((step - 1) as Step)}>
              <ArrowLeft size={15} /> Back
            </button>
          )}
          <h1 className="h-1">Book a visit</h1>
        </div>
        <Stepper step={step} onJump={goTo} />
      </div>

      {!authLoading && !user && (
        <p className="bk-note">
          <Link href="/auth/login">Sign in</Link> to request an appointment. You can browse doctors and times without an account.
        </p>
      )}

      <div className="bk-layout">
        <div className="bk-main">
          {step === 1 && (
            <DoctorStep doctors={doctors} loading={loading} error={error} selectedId={doctor?.id ?? null} onSelect={selectDoctor} />
          )}
          {step === 2 && doctor && (
            <TimeStep
              doctor={doctor}
              date={date}
              setDate={setDate}
              slot={slot}
              setSlot={setSlot}
              visitType={visitType}
              setVisitType={setVisitType}
            />
          )}
          {step === 3 && <ConfirmStep reason={reason} setReason={setReason} />}
        </div>

        <Summary
          doctor={doctor}
          date={date}
          slot={slot}
          visitType={visitType}
          step={step}
          canContinue={canContinue}
          busy={busy}
          error={submitError}
          onContinue={onContinue}
        />
      </div>
    </div>
  );
}
