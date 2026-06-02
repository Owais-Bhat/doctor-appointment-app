"use client";

import { useEffect, useState } from "react";
import { Brain, CalendarDays, CheckCircle2, HeartPulse, Mic, Phone, Search, Sparkles, Stethoscope, Video, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { MedFlowVoiceAssistant } from "@/components/MedFlowVoiceAssistant";
import { Headshot } from "@/components/medflow/Prototype";
import { useAuth } from "@/context/AuthContext";

type Doctor = {
  id: string;
  specialty: string;
  bio: string | null;
  experience_years: number | null;
  consultation_fee: number;
  rating: number;
  total_reviews: number;
  clinic_name: string | null;
  languages: string[] | null;
  profiles: {
    full_name: string;
    email: string;
    avatar_url: string | null;
  };
};

type ConsultationType = "video" | "phone" | "in_person";

function nameHue(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

function minDate() {
  return new Date().toISOString().split("T")[0];
}

function maxDate() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split("T")[0];
}

export default function BookPage() {
  const { user, getToken } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Booking modal state
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState(minDate());
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [consultationType, setConsultationType] = useState<ConsultationType>("video");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingDone, setBookingDone] = useState(false);

  useEffect(() => {
    fetch("/api/doctors")
      .then(r => r.json())
      .then(d => setDoctors(d.doctors ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Fetch slots when doctor or date changes
  useEffect(() => {
    if (!bookingDoctor || !selectedDate) return;
    setSlotsLoading(true);
    setSelectedSlot(null);
    fetch(`/api/doctors/${bookingDoctor.id}/slots?date=${selectedDate}`)
      .then(r => r.json())
      .then(d => setSlots(d.slots ?? []))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [bookingDoctor, selectedDate]);

  const openBooking = (doc: Doctor) => {
    setBookingDoctor(doc);
    setSelectedDate(minDate());
    setSelectedSlot(null);
    setConsultationType("video");
    setChiefComplaint("");
    setBookingError("");
    setBookingDone(false);
  };

  const closeBooking = () => {
    setBookingDoctor(null);
    setBookingDone(false);
  };

  const confirmBooking = async () => {
    if (!bookingDoctor || !selectedSlot || !selectedDate) return;
    if (!user) { setBookingError("Please log in to book."); return; }
    setBookingLoading(true);
    setBookingError("");
    try {
      const token = await getToken();
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          doctorId: bookingDoctor.id,
          date: selectedDate,
          time: selectedSlot + ":00",
          consultationType,
          chiefComplaint: chiefComplaint.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Booking failed");
      setBookingDone(true);
    } catch (err: unknown) {
      setBookingError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBookingLoading(false);
    }
  };

  const filtered = doctors.filter(d =>
    `${d.profiles?.full_name ?? ""} ${d.specialty} ${d.clinic_name ?? ""}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <div className="fade-enter col gap-7">
        <div className="row between wrap gap-4">
          <div className="col" style={{ gap: 6 }}>
            <div className="eyebrow">AI booking</div>
            <h1 className="h-1">Book care with <span className="hero-italic" style={{ color: "var(--accent)" }}>voice</span>.</h1>
            <p className="body">Map symptoms, pick a specialist, verify insurance, and reserve video, voice, or in-person visits.</p>
          </div>
          <div className="search" style={{ minWidth: 320 }}>
            <Search size={16} style={{ color: "var(--ink-3)" }} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search doctors or symptoms..."
            />
          </div>
        </div>

        <div className="admin-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, alignItems: "start" }}>
          <div className="col gap-4">
            <MedFlowVoiceAssistant />
            <div className="glass" style={{ padding: 22 }}>
              <div className="eyebrow" style={{ marginBottom: 14 }}>Symptom mapper</div>
              <div className="bento" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
                {[
                  [HeartPulse, "Chest pain", "Cardiology"],
                  [Brain, "Headaches", "Neurology"],
                  [Stethoscope, "General concern", "Primary care"],
                  [Mic, "Voice intake", "AI triage"],
                ].map(([Icon, label, spec]) => {
                  const Ico = Icon as typeof HeartPulse;
                  return (
                    <button
                      key={String(label)}
                      className="glass cell"
                      style={{ textAlign: "left", padding: 16, cursor: "pointer" }}
                      onClick={() => setQuery(String(spec))}
                    >
                      <Ico size={18} style={{ color: "var(--accent)" }} />
                      <div style={{ fontWeight: 700, marginTop: 10 }}>{String(label)}</div>
                      <div className="tiny">{String(spec)}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="glass" style={{ padding: 24 }}>
            <div className="row between" style={{ marginBottom: 18 }}>
              <div>
                <div className="eyebrow">Available doctors</div>
                <div className="h-3">{loading ? "Loading…" : `${filtered.length} verified provider${filtered.length !== 1 ? "s" : ""}`}</div>
              </div>
              <span className="pill accent"><Sparkles size={11} /> Verified</span>
            </div>

            {loading ? (
              <div className="col gap-3">
                {[1, 2, 3].map(i => <div key={i} style={{ height: 96, borderRadius: 18, border: "1px solid var(--line)", opacity: 0.4 }} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <div className="small" style={{ color: "var(--ink-3)" }}>No doctors found. Try a different search.</div>
              </div>
            ) : (
              <div className="col gap-3">
                {filtered.map(doc => {
                  const name = doc.profiles?.full_name ?? "Doctor";
                  const hue = nameHue(name);
                  return (
                    <div key={doc.id} className="dashboard-list-row row gap-4" style={{ padding: 16, borderRadius: 18, border: "1px solid var(--line)" }}>
                      <Headshot name={name} hue={hue} size={56} />
                      <div className="grow col" style={{ gap: 3 }}>
                        <div style={{ fontWeight: 800 }}>{name}</div>
                        <div className="small">
                          {doc.specialty}
                          {doc.clinic_name ? ` · ${doc.clinic_name}` : ""}
                          {doc.experience_years ? ` · ${doc.experience_years}y exp` : ""}
                        </div>
                        {doc.bio && (
                          <div className="tiny" style={{ color: "var(--ink-3)", lineHeight: 1.5 }}>
                            {doc.bio.slice(0, 80)}{doc.bio.length > 80 ? "…" : ""}
                          </div>
                        )}
                        {doc.languages && (
                          <div className="row gap-1 wrap" style={{ marginTop: 4 }}>
                            {(typeof doc.languages === 'string'
                              ? doc.languages.split(',').map(l => l.trim())
                              : doc.languages
                            ).slice(0, 3).map(lang => (
                              <span key={lang} className="pill" style={{ fontSize: 10 }}>{lang}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="col" style={{ gap: 8, alignItems: "flex-end" }}>
                        {doc.rating > 0 && (
                          <span className="pill good" style={{ fontSize: 11 }}>★ {doc.rating.toFixed(1)}</span>
                        )}
                        <button className="btn btn-primary btn-sm" onClick={() => openBooking(doc)}>
                          <CalendarDays size={13} /> Book ${doc.consultation_fee}
                        </button>
                        {doc.total_reviews > 0 && (
                          <span className="tiny" style={{ color: "var(--ink-3)" }}>{doc.total_reviews} reviews</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {bookingDoctor && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) closeBooking(); }}
        >
          <div className="glass" style={{ width: "100%", maxWidth: 480, padding: 28, maxHeight: "90vh", overflowY: "auto", position: "relative", borderRadius: 24 }}>
            <button onClick={closeBooking} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer", color: "var(--ink-3)" }}>
              <X size={18} />
            </button>

            {bookingDone ? (
              <div className="col" style={{ alignItems: "center", gap: 16, padding: "24px 0", textAlign: "center" }}>
                <CheckCircle2 size={48} style={{ color: "var(--good)" }} />
                <div className="h-3">Appointment requested!</div>
                <p className="small" style={{ color: "var(--ink-3)" }}>
                  Your appointment with Dr. {bookingDoctor.profiles.full_name} on {selectedDate} at {selectedSlot} is pending confirmation.
                </p>
                <button className="btn btn-primary" onClick={closeBooking}>Done</button>
              </div>
            ) : (
              <div className="col gap-5">
                <div>
                  <div className="eyebrow" style={{ marginBottom: 4 }}>Book appointment</div>
                  <div className="h-3">Dr. {bookingDoctor.profiles.full_name}</div>
                  <div className="small" style={{ color: "var(--ink-3)", marginTop: 2 }}>
                    {bookingDoctor.specialty}{bookingDoctor.clinic_name ? ` · ${bookingDoctor.clinic_name}` : ""}
                  </div>
                </div>

                {/* Date */}
                <div>
                  <div className="eyebrow" style={{ marginBottom: 8 }}>Select date</div>
                  <input
                    type="date"
                    value={selectedDate}
                    min={minDate()}
                    max={maxDate()}
                    onChange={e => setSelectedDate(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--surface-2)", fontSize: 14, color: "var(--ink-1)" }}
                  />
                </div>

                {/* Time slots */}
                <div>
                  <div className="eyebrow" style={{ marginBottom: 8 }}>Available times</div>
                  {slotsLoading ? (
                    <div className="small" style={{ color: "var(--ink-3)" }}>Loading slots…</div>
                  ) : slots.length === 0 ? (
                    <div className="small" style={{ color: "var(--ink-3)" }}>No available slots for this date.</div>
                  ) : (
                    <div className="modal-slot-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(70px, 1fr))", gap: 8 }}>
                      {slots.map(slot => (
                        <button
                          key={slot}
                          onClick={() => setSelectedSlot(slot)}
                          className={selectedSlot === slot ? "btn btn-primary btn-sm" : "btn btn-glass btn-sm"}
                          style={{ justifyContent: "center", fontSize: 13 }}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Consultation type */}
                <div>
                  <div className="eyebrow" style={{ marginBottom: 8 }}>Consultation type</div>
                  <div className="row gap-2">
                    {([
                      ["video", "Video", Video],
                      ["phone", "Phone", Phone],
                      ["in_person", "In-person", Stethoscope],
                    ] as [ConsultationType, string, LucideIcon][]).map(([val, label, Icon]) => (
                      <button
                        key={val}
                        onClick={() => setConsultationType(val)}
                        className={consultationType === val ? "btn btn-primary btn-sm" : "btn btn-glass btn-sm"}
                        style={{ flex: 1, justifyContent: "center", gap: 6 }}
                      >
                        <Icon size={13} /> {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chief complaint */}
                <div>
                  <div className="eyebrow" style={{ marginBottom: 8 }}>Reason for visit <span style={{ fontWeight: 400, textTransform: "none", opacity: 0.6 }}>(optional)</span></div>
                  <textarea
                    value={chiefComplaint}
                    onChange={e => setChiefComplaint(e.target.value)}
                    placeholder="Briefly describe your symptoms or reason…"
                    rows={3}
                    className="input"
                    style={{ resize: "vertical", fontFamily: "inherit" }}
                  />
                </div>

                {bookingError && (
                  <div style={{ padding: "10px 14px", borderRadius: 10, background: "color-mix(in oklab, red 8%, transparent)", border: "1px solid color-mix(in oklab, red 20%, transparent)", fontSize: 13, color: "red" }}>
                    {bookingError}
                  </div>
                )}

                <button
                  className="btn btn-primary"
                  style={{ justifyContent: "center", width: "100%" }}
                  disabled={!selectedSlot || bookingLoading || !user}
                  onClick={confirmBooking}
                >
                  <CalendarDays size={14} />
                  {!user ? "Log in to book" : bookingLoading ? "Booking…" : `Confirm booking · $${bookingDoctor.consultation_fee}`}
                </button>
                {!user && (
                  <div className="tiny" style={{ textAlign: "center", color: "var(--ink-3)" }}>
                    <a href="/auth/login" style={{ color: "var(--accent)" }}>Log in</a> or <a href="/auth/register" style={{ color: "var(--accent)" }}>create an account</a> to book.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
