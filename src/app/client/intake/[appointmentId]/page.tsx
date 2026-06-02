"use client";

import { useState, useEffect, use } from "react";
import { CheckCircle2, FileText, AlertCircle, Send } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type Appointment = {
  id: string;
  appointment_date: string;
  appointment_time: string;
  chief_complaint: string | null;
  doctor_profiles: { profiles: { full_name: string } };
};

export default function IntakeFormPage({ params }: { params: Promise<{ appointmentId: string }> }) {
  const { appointmentId } = use(params);
  const { user, getToken } = useAuth();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [formData, setFormData] = useState({
    chief_complaint: "",
    current_medications: "",
    allergies: "",
    symptoms_duration: "",
    severity: "Mild",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!user) return;
    getToken().then(token =>
      fetch(`/api/patient/intake?appointmentId=${appointmentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.json())
        .then(d => {
          if (d.appointment) {
            setAppointment(d.appointment);
            if (d.appointment.chief_complaint) {
              setFormData(prev => ({ ...prev, chief_complaint: d.appointment.chief_complaint }));
            }
          }
        })
    );
  }, [user, appointmentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const token = await getToken();
    const notes = `INTAKE:\nMeds: ${formData.current_medications}\nAllergies: ${formData.allergies}\nDuration: ${formData.symptoms_duration}\nSeverity: ${formData.severity}`;
    await fetch("/api/patient/intake", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ appointmentId, chief_complaint: formData.chief_complaint, notes }),
    });
    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted && appointment) {
    const doctorName = appointment.doctor_profiles?.profiles?.full_name ?? "your doctor";
    return (
      <div className="fade-enter col gap-6" style={{ maxWidth: 480, margin: "0 auto", padding: "48px 0", textAlign: "center" }}>
        <CheckCircle2 size={56} style={{ color: "var(--good)", margin: "0 auto" }} />
        <h1 className="h-1">Form submitted!</h1>
        <p className="body">Your intake form has been sent to Dr. {doctorName}. They will review it before your appointment.</p>
        <div className="glass" style={{ padding: 20, textAlign: "left" }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Appointment details</div>
          <div style={{ fontWeight: 700 }}>{new Date(appointment.appointment_date + "T00:00:00").toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}</div>
          <div className="small" style={{ color: "var(--ink-3)" }}>{appointment.appointment_time?.substring(0, 5)}</div>
        </div>
        <a href="/client/appointments" className="btn btn-primary" style={{ alignSelf: "center" }}>Back to appointments</a>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="fade-enter col gap-7">
        <div className="glass" style={{ padding: 32, textAlign: "center" }}>
          <div className="small" style={{ color: "var(--ink-3)" }}>Loading appointment…</div>
        </div>
      </div>
    );
  }

  const doctorName = appointment.doctor_profiles?.profiles?.full_name ?? "your doctor";
  const apptDate = new Date(appointment.appointment_date + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <div className="fade-enter col gap-7" style={{ maxWidth: 680, margin: "0 auto" }}>
      <div className="col" style={{ gap: 6, textAlign: "center" }}>
        <div className="eyebrow">Pre-visit</div>
        <h1 className="h-1">Intake Form</h1>
        <p className="body">Help Dr. {doctorName} prepare for your visit on {apptDate}.</p>
      </div>

      <form onSubmit={handleSubmit} className="col gap-5">
        <div className="glass" style={{ padding: 24 }}>
          <div className="row gap-2" style={{ marginBottom: 18, color: "var(--accent)", fontWeight: 700 }}>
            <FileText size={16} />
            <span>Symptom details</span>
          </div>

          <div className="col gap-4">
            <div className="col" style={{ gap: 8 }}>
              <label className="eyebrow">Primary reason for visit</label>
              <textarea
                required
                rows={3}
                className="input"
                style={{ resize: "vertical" }}
                placeholder="Describe your symptoms in detail…"
                value={formData.chief_complaint}
                onChange={e => setFormData({ ...formData, chief_complaint: e.target.value })}
              />
            </div>

            <div className="row gap-4">
              <div className="col grow" style={{ gap: 8 }}>
                <label className="eyebrow">Duration</label>
                <input
                  className="input"
                  placeholder="e.g. 3 days, 2 weeks"
                  value={formData.symptoms_duration}
                  onChange={e => setFormData({ ...formData, symptoms_duration: e.target.value })}
                />
              </div>
              <div className="col grow" style={{ gap: 8 }}>
                <label className="eyebrow">Severity</label>
                <select
                  className="input"
                  value={formData.severity}
                  onChange={e => setFormData({ ...formData, severity: e.target.value })}
                >
                  <option>Mild</option>
                  <option>Moderate</option>
                  <option>Severe</option>
                  <option>Emergency</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="glass" style={{ padding: 24 }}>
          <div className="row gap-2" style={{ marginBottom: 18, color: "var(--accent)", fontWeight: 700 }}>
            <AlertCircle size={16} />
            <span>Medical history</span>
          </div>

          <div className="col gap-4">
            <div className="col" style={{ gap: 8 }}>
              <label className="eyebrow">Current medications</label>
              <textarea
                rows={2}
                className="input"
                style={{ resize: "vertical" }}
                placeholder="List any medications you are currently taking…"
                value={formData.current_medications}
                onChange={e => setFormData({ ...formData, current_medications: e.target.value })}
              />
            </div>
            <div className="col" style={{ gap: 8 }}>
              <label className="eyebrow">Known allergies</label>
              <textarea
                rows={2}
                className="input"
                style={{ resize: "vertical" }}
                placeholder="List any known drug or food allergies…"
                value={formData.allergies}
                onChange={e => setFormData({ ...formData, allergies: e.target.value })}
              />
            </div>
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={submitting} style={{ alignSelf: "flex-end" }}>
          <Send size={14} /> {submitting ? "Submitting…" : "Submit intake form"}
        </button>
      </form>
    </div>
  );
}
