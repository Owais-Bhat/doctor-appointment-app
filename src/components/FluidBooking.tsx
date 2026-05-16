"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { createAppointment } from "@/app/actions";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIMES = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
  "04:00 PM", "04:30 PM", "05:00 PM"
];

export function FluidBooking() {
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (!selectedTime) return;

    setIsLoading(true);
    try {
      // In a real scenario, we would get doctorId from the SymptomMapper or a selection
      const result = await createAppointment({
        doctorId: "some-doctor-id", // Placeholder: in full app, this comes from state
        date: `2026-04-${14 + selectedDay}`,
        time: selectedTime,
      });

      if (result.success) {
        setIsConfirmed(true);
        setTimeout(() => setIsConfirmed(false), 3000);
      } else {
        alert(result.message || "Booking failed");
      }
    } catch (e) {
      alert("An error occurred during booking. Please ensure you are signed in.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 w-full max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold tracking-tight mb-2">Select Your Slot</h2>
        <p className="opacity-60">Pick a time that works best for you</p>
      </div>

      <div className="w-full glass rounded-[40px] p-8 md:p-12 relative overflow-hidden">
        <div className="flex items-center justify-between mb-12 overflow-x-auto pb-4 no-scrollbar">
          {DAYS.map((day, idx) => (
            <motion.button
              key={day}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedDay(idx)}
              className={cn(
                "flex flex-col items-center justify-center min-w-[70px] h-20 rounded-2xl transition-all duration-300",
                selectedDay === idx
                  ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/30 scale-110"
                  : "bg-surface-200 dark:bg-surface-300 opacity-60 hover:opacity-100"
              )}
            >
              <span className="text-xs opacity-70 mb-1">{day}</span>
              <span className="text-lg font-bold">{14 + idx}</span>
            </motion.button>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-10">
          <AnimatePresence mode="popLayout">
            {TIMES.map((time) => (
              <motion.button
                key={time}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedTime(time)}
                className={cn(
                  "py-4 rounded-2xl text-sm font-medium transition-all border",
                  selectedTime === time
                    ? "bg-brand-primary text-white border-brand-primary shadow-md"
                    : "glass border-transparent opacity-80 hover:opacity-100"
                )}
              >
                {time}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        <div className="flex flex-col items-center gap-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={!selectedTime || isLoading}
            onClick={handleConfirm}
            className={cn(
              "px-12 py-4 rounded-full font-bold transition-all flex items-center gap-3",
              selectedTime && !isLoading
                ? "bg-brand-primary text-white shadow-xl shadow-brand-primary/20 cursor-pointer"
                : "bg-surface-200 dark:bg-surface-300 opacity-50 cursor-not-allowed"
            )}
          >
            {isConfirmed ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Confirmed!
              </>
            ) : isLoading ? (
              "Processing..."
            ) : (
              "Confirm Appointment"
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
