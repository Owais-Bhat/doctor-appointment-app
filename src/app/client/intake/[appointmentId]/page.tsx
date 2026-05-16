"use client";

import React, { useState, useEffect } from 'react';
import { CheckCircle2, FileText, AlertCircle, Send } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

export default function IntakeFormPage({ params }: { params: { appointmentId: string } }) {
  const { user } = useAuth();
  const [appointment, setAppointment] = useState<any>(null);
  const [formData, setFormData] = useState({
    chief_complaint: '',
    current_medications: '',
    allergies: '',
    symptoms_duration: '',
    severity: 'Mild',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    async function fetchAppointment() {
      const supabase = createClient();
      const { data } = await supabase
        .from('appointments')
        .select('*, doctor_profiles(*)')
        .eq('id', params.appointmentId)
        .single();

      if (data) {
        setAppointment(data);
        // If appointment already has a complaint, pre-fill it
        if (data.chief_complaint) {
          setFormData(prev => ({ ...prev, chief_complaint: data.chief_complaint }));
        }
      }
    }
    fetchAppointment();
  }, [params.appointmentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('appointments')
        .update({
          chief_complaint: formData.chief_complaint,
          notes: `INTAKE FORM:\nMeds: ${formData.current_medications}\nAllergies: ${formData.allergies}\nDuration: ${formData.symptoms_duration}\nSeverity: ${formData.severity}`
        })
        .eq('id', params.appointmentId);

      if (error) throw error;

      setIsSubmitted(true);
      toast.success("Intake form submitted successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit intake form");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!appointment) return <div className="p-6 text-gray-500">Loading appointment details...</div>;
  if (isSubmitted) return <SubmittedState appointment={appointment} />;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Pre-Visit Intake Form</h1>
        <p className="text-gray-500">Help Dr. {appointment.doctor_profiles?.full_name} prepare for your visit on {format(new Date(appointment.appointment_date), 'MMM dd')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-8 bg-surface-100 rounded-3xl border border-surface-300 shadow-sm space-y-6">
          <div className="flex items-center gap-2 text-brand-primary font-bold mb-4">
            <FileText size={20} />
            <h2>Symptom Details</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-600">What is the primary reason for your visit?</label>
              <textarea
                required
                rows={3}
                className="w-full p-4 rounded-2xl bg-surface-200 border-transparent outline-none focus:ring-2 focus:ring-brand-primary transition-all"
                placeholder="Describe your symptoms in detail..."
                value={formData.chief_complaint}
                onChange={e => setFormData({...formData, chief_complaint: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-600">Duration of symptoms</label>
                <input
                  type="text"
                  placeholder="e.g. 3 days, 2 weeks"
                  className="w-full p-3 rounded-xl bg-surface-200 border-transparent outline-none focus:ring-2 focus:ring-brand-primary"
                  value={formData.symptoms_duration}
                  onChange={e => setFormData({...formData, symptoms_duration: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-600">Symptom Severity</label>
                <select
                  className="w-full p-3 rounded-xl bg-surface-200 border-transparent outline-none focus:ring-2 focus:ring-brand-primary"
                  value={formData.severity}
                  onChange={e => setFormData({...formData, severity: e.target.value})}
                >
                  <option value="Mild">Mild</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Severe">Severe</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-surface-300 space-y-4">
            <div className="flex items-center gap-2 text-brand-primary font-bold mb-4">
              <AlertCircle size={20} />
              <h2>Medical History</h2>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-600">Current Medications</label>
              <textarea
                rows={2}
                className="w-full p-4 rounded-2xl bg-surface-200 border-transparent outline-none focus:ring-2 focus:ring-brand-primary"
                placeholder="List any medications you are currently taking..."
                value={formData.current_medications}
                onChange={e => setFormData({...formData, current_medications: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-600">Known Allergies</label>
              <textarea
                rows={2}
                className="w-full p-4 rounded-2xl bg-surface-200 border-transparent outline-none focus:ring-2 focus:ring-brand-primary"
                placeholder="List any known drug or food allergies..."
                value={formData.allergies}
                onChange={e => setFormData({...formData, allergies: e.target.value})}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full p-4 bg-brand-primary text-white rounded-2xl font-bold hover:bg-brand-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Submit Intake Form'}
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}

function SubmittedState({ appointment }: { appointment: any }) {
  return (
    <div className="max-w-md mx-auto text-center space-y-6 py-12">
      <div className="flex justify-center">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center animate-bounce">
          <CheckCircle2 size={40} />
        </div>
      </div>
      <h1 className="text-3xl font-bold">Form Submitted!</h1>
      <p className="text-gray-500">Thank you. Your information has been sent to Dr. {appointment.doctor_profiles?.full_name}. They will review it before your appointment.</p>
      <div className="p-6 bg-surface-100 rounded-3xl border border-surface-300 text-left space-y-2">
        <p className="text-xs font-bold text-gray-400 uppercase">Appointment Details</p>
        <p className="font-bold">{format(new Date(appointment.appointment_date), 'MMM dd, yyyy')}</p>
        <p className="text-sm text-gray-600">{appointment.appointment_time}</p>
      </div>
      <a href="/client/appointments" className="inline-block px-8 py-3 bg-brand-primary text-white rounded-full font-bold hover:opacity-90 transition-all">
        Return to My Appointments
      </a>
    </div>
  );
}
