"use client";

import { motion } from "framer-motion";
import { Calendar, Clock, Activity, User, ChevronRight, MessageCircle } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const BentoCard = ({ children, className, delay = 0, title, subtitle }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    whileHover={{ y: -5 }}
    className={cn("glass rounded-3xl p-6 flex flex-col h-full group cursor-pointer", className)}
  >
    {title && (
      <div className="mb-4 flex justify-between items-center">
        <div>
          <p className="text-xs opacity-50 font-medium uppercase tracking-wider">{subtitle}</p>
          <h3 className="text-lg font-bold">{title}</h3>
        </div>
        <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity text-brand-primary" />
      </div>
    )}
    <div className="flex-1 flex flex-col justify-center">
      {children}
    </div>
  </motion.div>
);

export function HealthBento() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full max-w-6xl mx-auto mt-12">
      {/* Appointment Card - Large */}
      <BentoCard
        className="md:col-span-2 md:row-span-2 bg-brand-primary/5"
        title="Next Appointment"
        subtitle="Upcoming"
        delay={0.1}
      >
        <div className="flex flex-col items-center justify-center text-center py-10">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-brand-primary blur-2xl opacity-20 animate-pulse" />
            <div className="relative glass w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-brand-primary border-brand-primary/30">
              14:30
            </div>
          </div>
          <h4 className="text-2xl font-bold mb-2">Dr. Sarah Jenkins</h4>
          <p className="opacity-60 mb-6">Cardiology Specialist • Zoom Call</p>
          <div className="flex gap-3">
            <div className="glass px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2">
              <Clock className="w-3 h-3" /> In 2 hours
            </div>
            <div className="glass px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 text-brand-primary">
              <MessageCircle className="w-3 h-3" /> Pre-call Note
            </div>
          </div>
        </div>
      </BentoCard>

      {/* Health Stats Card */}
      <BentoCard
        className="md:col-span-1"
        title="Heart Rate"
        subtitle="Vitals"
        delay={0.2}
      >
        <div className="flex items-center justify-between">
          <div className="p-3 rounded-2xl bg-red-500/10 text-red-500">
            <Activity className="w-6 h-6" />
          </div>
          <div className="text-right">
            <span className="text-3xl font-bold">72</span>
            <span className="text-xs opacity-50 ml-1">bpm</span>
          </div>
        </div>
      </BentoCard>

      {/* Quick Actions Card */}
      <BentoCard
        className="md:col-span-1"
        title="Quick Action"
        subtitle="Utility"
        delay={0.3}
      >
        <div className="grid grid-cols-2 gap-2">
          <button className="p-3 rounded-xl bg-surface-200 dark:bg-surface-300 text-xs font-medium hover:bg-brand-primary hover:text-white transition-colors">
            Refill
          </button>
          <button className="p-3 rounded-xl bg-surface-200 dark:bg-surface-300 text-xs font-medium hover:bg-brand-primary hover:text-white transition-colors">
            Reports
          </button>
        </div>
      </BentoCard>

      {/* Profile Card */}
      <BentoCard
        className="md:col-span-2"
        title="Patient Profile"
        subtitle="Account"
        delay={0.4}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-brand-primary to-brand-secondary" />
          <div>
            <p className="font-bold text-lg">Alex Rivera</p>
            <p className="text-xs opacity-50">Member since 2023 • Blood Type O+</p>
          </div>
          <div className="ml-auto p-2 rounded-full glass">
            <User className="w-4 h-4" />
          </div>
        </div>
      </BentoCard>
    </div>
  );
}
