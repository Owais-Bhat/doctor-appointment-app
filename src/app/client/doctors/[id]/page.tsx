"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase';
import { SlotPicker } from '@/components/booking/SlotPicker';
import { CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function DoctorProfilePage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const [doctor, setDoctor] = useState<any>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string, time: string } | null>(null);
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    async function fetchDoctor() {
      const supabase = createClient();
      const { data } = await supabase
        .from('doctor_profiles')
        .select('*, profiles(*)')
        .eq('id', params.id)
        .single();
      setDoctor(data);
    }
    fetchDoctor();
  }, [params.id]);

  const handleConfirmBooking = async () => {
    if (!selectedSlot) return;
    setIsBooking(true);

    try {
      // Get Firebase ID Token for secure server-side verification
      const idToken = await user?.getIdToken();

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken,
          appointmentData: {
            doctorId: doctor.id,
            doctorName: doctor.profiles?.full_name,
            doctorProfileId: doctor.profile_id,
            date: selectedSlot.date,
            time: selectedSlot.time,
            type: 'in_person',
            patientName: user?.displayName || 'Patient'
          }
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Booking failed');

      toast.success('Appointment booked successfully!');
      setSelectedSlot(null);
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setIsBooking(false);
    }
  };

  if (!doctor) return <div className="p-6 text-gray-500">Loading doctor profile...</div>;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 p-8 bg-surface-100 rounded-3xl border border-surface-300 text-center">
          <div className="w-32 h-32 rounded-full bg-surface-200 mx-auto mb-4 overflow-hidden border-4 border-white shadow-lg">
            {doctor.image_url ? <img src={doctor.image_url} alt={doctor.profiles?.full_name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-2xl">DR</div>}
          </div>
          <h1 className="text-2xl font-bold">{doctor.profiles?.full_name}</h1>
          <p className="text-brand-primary font-medium mb-4">{doctor.specialty}</p>
          <div className="flex justify-center gap-4 mb-6">
             <div className="text-center">
               <p className="text-xs text-gray-500 uppercase font-bold">Rating</p>
               <p className="font-bold">{doctor.rating} ★</p>
             </div>
             <div className="text-center border-x border-surface-300 px-4">
               <p className="text-xs text-gray-500 uppercase font-bold">Exp</p>
               <p className="font-bold">{doctor.experience_years}y</p>
             </div>
             <div className="text-center">
               <p className="text-xs text-gray-500 uppercase font-bold">Fee</p>
               <p className="font-bold">${doctor.consultation_fee}</p>
             </div>
          </div>
          <p className="text-sm text-gray-600 text-left italic leading-relaxed">
            "{doctor.bio || 'Professional medical practitioner dedicated to patient care.'}"
          </p>
        </div>

        <div className="md:col-span-2 space-y-6">
          <SlotPicker
            doctorId={doctor.id}
            onSelectSlot={(slot) => setSelectedSlot(slot)}
          />

          {selectedSlot && (
            <div className="p-6 bg-brand-primary/10 rounded-3xl border border-brand-primary/20 flex items-center justify-between animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-brand-primary text-white rounded-2xl">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <p className="font-bold">Selected Slot</p>
                  <p className="text-sm text-gray-600">{selectedSlot.date} at {selectedSlot.time}</p>
                </div>
              </div>
              <button
                onClick={handleConfirmBooking}
                disabled={isBooking}
                className="px-8 py-3 bg-brand-primary text-white rounded-full font-bold hover:opacity-90 transition-all shadow-lg disabled:opacity-50"
              >
                {isBooking ? 'Booking...' : 'Confirm Now'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
