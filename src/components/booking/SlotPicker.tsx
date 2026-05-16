"use client";

import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { format, addDays, startOfDay, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

export function SlotPicker({ doctorId, onSelectSlot }: { doctorId: string, onSelectSlot: (slot: { date: string, time: string }) => void }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSlots() {
      setIsLoading(true);
      setError(null);
      try {
        const supabase = createClient();
        const dateStr = format(selectedDate, 'yyyy-MM-dd');

        // 1. Get doctor's weekly availability for this day of the week
        const dayOfWeek = selectedDate.getDay(); // 0=Sun, 1=Mon... (Note: our DB uses 0=Mon, 6=Sun)
        const dbDayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

        const { data: availability, error: availError } = await supabase
          .from('doctor_availability')
          .select('*')
          .eq('doctor_id', doctorId)
          .eq('day_of_week', dbDayOfWeek)
          .eq('is_active', true)
          .single();

        if (availError || !availability) {
          setAvailableSlots([]);
          if (availError) throw availError;
          return;
        }

        // 2. Generate all possible slots based on start_time, end_time, and duration
        const slots: string[] = [];
        let current = new Date(`${dateStr}T${availability.start_time}:00`);
        const end = new Date(`${dateStr}T${availability.end_time}:00`);
        const duration = availability.slot_duration_minutes || 30;

        while (current < end) {
          slots.push(format(current, 'HH:mm'));
          current.setMinutes(current.getMinutes() + duration);
        }

        // 3. Remove already booked slots for this specific date
        const { data: booked } = await supabase
          .from('appointments')
          .select('appointment_time')
          .eq('doctor_id', doctorId)
          .eq('appointment_date', dateStr)
          .eq('status', 'confirmed');

        const bookedTimes = booked?.map(b => b.appointment_time) || [];
        const finalSlots = slots.filter(slot => !bookedTimes.includes(slot));

        setAvailableSlots(finalSlots);
      } catch (err: any) {
        console.error("Error fetching slots:", err);
        setError("Failed to load available time slots.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchSlots();
  }, [selectedDate, doctorId]);

  const days = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i));

  return (
    <div className="space-y-6 p-6 bg-surface-100 rounded-3xl border border-surface-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <CalendarIcon size={20} className="text-brand-primary" />
          Select Date & Time
        </h3>
      </div>

      {/* Date Picker Horizontal Scroll */}
      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
        {days.map((date, i) => (
          <button
            key={i}
            onClick={() => setSelectedDate(date)}
            className={cn(
              "flex-shrink-0 w-16 py-3 rounded-2xl border transition-all text-center",
              selectedDate.toDateString() === date.toDateString()
                ? "bg-brand-primary text-white border-brand-primary shadow-md"
                : "bg-white text-gray-500 border-surface-300 hover:border-brand-primary"
            )}
          >
            <p className="text-xs font-medium uppercase">{format(date, 'EEE')}</p>
            <p className="text-lg font-bold">{format(date, 'dd')}</p>
          </button>
        ))}
      </div>

      {/* Time Slots Grid */}
      <div className="space-y-4">
        <p className="text-sm font-semibold text-gray-500 flex items-center gap-2">
          <Clock size={14} /> Available Slots for {format(selectedDate, 'MMM dd, yyyy')}
        </p>

        {isLoading ? (
          <div className="grid grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-surface-200 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-center gap-3">
            <AlertCircle size={18} />
            <p className="text-sm">{error}</p>
          </div>
        ) : availableSlots.length > 0 ? (
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {availableSlots.map(slot => (
              <button
                key={slot}
                onClick={() => onSelectSlot({ date: format(selectedDate, 'yyyy-MM-dd'), time: slot })}
                className="p-3 bg-white border border-surface-300 rounded-xl text-sm font-bold hover:border-brand-primary hover:text-brand-primary transition-all"
              >
                {slot}
              </button>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-surface-200 rounded-2xl border-2 border-dashed border-surface-300 text-gray-500">
            <p>No available slots for this date.</p>
          </div>
        )}
      </div>
    </div>
  );
}
