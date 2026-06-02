"use client";

import { useState, useEffect, use } from "react";
import { useAuth } from "@/context/AuthContext";
import { CalendarDays, Star, Clock, DollarSign, CheckCircle2, Video, Phone } from "lucide-react";
import { Headshot } from "@/components/medflow/Prototype";

type Doctor = {
  id: string;
  profile_id: string;
  specialty: string;
  consultation_fee: number;
  experience_years: number;
  bio: string;
  rating: number;
  total_reviews: number;
  is_verified: boolean;
  profiles: { full_name: string };
};

type Slot = { time: string; available: boolean };

function nameHue(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

const CONSULT_TYPES = [
  { value: "in_person", label: "In-person", icon: <CalendarDays size={13} /> },
  { value: "video", label: "Video", icon: <Video size={13} /> },
  { value: "phone", label: "Phone", icon: <Phone size={13} /> },
];

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toISO(d: Date) {
  return d.toISOString().split("T")[0];
}

export default function DoctorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, getToken } = useAuth();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const dates = Array.from({ length: 14 }, (_, i) => addDays(today, i));
  const [selectedDate, setSelectedDate] = useState<string>(toISO(today));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [consultType, setConsultType] = useState("in_person");
  const [complaint, setComplaint] = useState("");
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);

  useEffect(() => {
    fetch(`/api/doctors/${id}`)
      .then(r => r.json())
      .then(d => setDoctor(d.doctor ?? null))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id || !selectedDate) return;
    setSlotsLoading(true);
    setSelectedTime(null);
    fetch(`/api/doctors/${id}/slots?date=${selectedDate}`)
      .then(r => r.json())
      .then(d => setSlots(d.slots ?? []))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [id, selectedDate]);

  const handleBook = async () => {
    if (!selectedTime || !doctor) return;
    setBooking(true);
    const token = await getToken();
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        doctorId: doctor.id,
        date: selectedDate,
        time: selectedTime,
        consultationType: consultType,
        chiefComplaint: complaint,
      }),
    });
    setBooking(false);
    if (res.ok) {
      setBooked(true);
    }
  };

  if (loading) return (
    <div className="fade-enter col gap-7">
      <div className="glass" style={{ padding: 32, textAlign: "center" }}>
        <div className="small" style={{ color: "var(--ink-3)" }}>Loading…</div>
      </div>
    </div>
  );

  if (!doctor) return (
    <div className="fade-enter col gap-7">
      <div className="glass" style={{ padding: 32, textAlign: "center" }}>
        <div className="small" style={{ color: "var(--bad)" }}>Doctor not found.</div>
      </div>
    </div>
  );

  const doctorName = doctor.profiles?.full_name ?? "Doctor";

  if (booked) return (
    <div className="fade-enter col gap-6" style={{ maxWidth: 480, margin: "0 auto", padding: "48px 0", textAlign: "center" }}>
      <CheckCircle2 size={56} style={{ color: "var(--good)", margin: "0 auto" }} />
      <h1 className="h-1">Appointment booked!</h1>
      <p className="body">Your appointment with Dr. {doctorName} on {selectedDate} at {selectedTime?.substring(0, 5)} has been requested. Complete payment to confirm.</p>
      <a href="/client/appointments" className="btn btn-primary" style={{ alignSelf: "center" }}>View my appointments</a>
    </div>
  );

  const availableSlots = slots.filter(s => s.available);

  return (
    <div className="fade-enter col gap-7">
      <div className="row gap-6" style={{ flexWrap: "wrap" }}>
        {/* Doctor info card */}
        <div className="glass" style={{ padding: 28, minWidth: 240, maxWidth: 300 }}>
          <div className="col gap-4" style={{ alignItems: "center", textAlign: "center" }}>
            <Headshot name={doctorName} hue={nameHue(doctorName)} size={80} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>{doctorName}</div>
              <div className="small" style={{ color: "var(--ink-3)" }}>{doctor.specialty}</div>
            </div>
            <div className="row gap-2" style={{ flexWrap: "wrap", justifyContent: "center" }}>
              {doctor.is_verified && <span className="pill good">Verified</span>}
            </div>
            <div className="bento" style={{ gridTemplateColumns: "1fr 1fr 1fr", width: "100%" }}>
              <div className="glass cell" style={{ textAlign: "center", padding: "10px 8px" }}>
                <div className="row gap-1" style={{ justifyContent: "center", color: "var(--accent)", marginBottom: 4 }}><Star size={11} /></div>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{doctor.rating > 0 ? doctor.rating.toFixed(1) : "—"}</div>
                <div className="tiny" style={{ color: "var(--ink-3)" }}>{doctor.total_reviews} reviews</div>
              </div>
              <div className="glass cell" style={{ textAlign: "center", padding: "10px 8px" }}>
                <div className="row gap-1" style={{ justifyContent: "center", color: "var(--accent)", marginBottom: 4 }}><Clock size={11} /></div>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{doctor.experience_years ?? "—"}</div>
                <div className="tiny" style={{ color: "var(--ink-3)" }}>years exp</div>
              </div>
              <div className="glass cell" style={{ textAlign: "center", padding: "10px 8px" }}>
                <div className="row gap-1" style={{ justifyContent: "center", color: "var(--accent)", marginBottom: 4 }}><DollarSign size={11} /></div>
                <div style={{ fontWeight: 800, fontSize: 15 }}>${doctor.consultation_fee}</div>
                <div className="tiny" style={{ color: "var(--ink-3)" }}>per visit</div>
              </div>
            </div>
            {doctor.bio && (
              <p className="small" style={{ color: "var(--ink-3)", fontStyle: "italic", textAlign: "left" }}>
                "{doctor.bio}"
              </p>
            )}
          </div>
        </div>

        {/* Booking panel */}
        <div className="glass col gap-5 grow" style={{ padding: 28, minWidth: 300 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 4 }}>Select date</div>
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
              {dates.map(d => {
                const iso = toISO(d);
                const isSelected = iso === selectedDate;
                return (
                  <button
                    key={iso}
                    onClick={() => setSelectedDate(iso)}
                    style={{
                      flexShrink: 0, padding: "8px 14px", borderRadius: 12, border: "1px solid var(--line)",
                      background: isSelected ? "var(--accent)" : "transparent",
                      color: isSelected ? "#fff" : "var(--ink-1)",
                      fontWeight: isSelected ? 800 : 500, cursor: "pointer", fontSize: 13,
                    }}
                  >
                    <div>{d.toLocaleDateString(undefined, { weekday: "short" })}</div>
                    <div>{d.getDate()}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Available slots</div>
            {slotsLoading ? (
              <div className="small" style={{ color: "var(--ink-3)" }}>Loading slots…</div>
            ) : availableSlots.length === 0 ? (
              <div className="small" style={{ color: "var(--ink-3)" }}>No available slots on this date.</div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {availableSlots.map(slot => {
                  const isSelected = slot.time === selectedTime;
                  const [h, m] = slot.time.split(":").map(Number);
                  const label = `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
                  return (
                    <button
                      key={slot.time}
                      onClick={() => setSelectedTime(slot.time)}
                      style={{
                        padding: "7px 16px", borderRadius: 10, border: "1px solid var(--line)",
                        background: isSelected ? "var(--accent)" : "transparent",
                        color: isSelected ? "#fff" : "var(--ink-1)",
                        fontWeight: isSelected ? 800 : 500, cursor: "pointer", fontSize: 13,
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Consultation type</div>
            <div className="row gap-2">
              {CONSULT_TYPES.map(ct => (
                <button
                  key={ct.value}
                  onClick={() => setConsultType(ct.value)}
                  className={`btn btn-sm ${consultType === ct.value ? "btn-primary" : "btn-glass"}`}
                >
                  {ct.icon} {ct.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Reason for visit</div>
            <textarea
              className="input"
              rows={3}
              style={{ resize: "vertical", width: "100%" }}
              placeholder="Briefly describe your symptoms or reason for the visit…"
              value={complaint}
              onChange={e => setComplaint(e.target.value)}
            />
          </div>

          <button
            className="btn btn-primary"
            disabled={!selectedTime || booking || !user}
            onClick={handleBook}
            style={{ alignSelf: "flex-start" }}
          >
            <CalendarDays size={14} />
            {booking ? "Booking…" : selectedTime ? `Book ${selectedDate} at ${selectedTime?.substring(0, 5)}` : "Select a time slot"}
          </button>
        </div>
      </div>
    </div>
  );
}
