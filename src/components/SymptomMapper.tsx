"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Brain, Bone, Wind, Activity, Eye, Ear, Smile } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const BODY_ZONES = [
  { id: "brain", name: "Neurology", icon: Brain, color: "bg-purple-500", area: "Head" },
  { id: "eye", name: "Ophthalmology", icon: Eye, color: "bg-blue-500", area: "Head" },
  { id: "ear", name: "Otology", icon: Ear, color: "bg-blue-400", area: "Head" },
  { id: "mouth", name: "Dentistry", icon: Smile, color: "bg-green-500", area: "Head" },
  { id: "heart", name: "Cardiology", icon: Heart, color: "bg-red-500", area: "Chest" },
  { id: "lungs", name: "Pulmonology", icon: Wind, color: "bg-cyan-500", area: "Chest" },
  { id: "stomach", name: "Gastroenterology", icon: Activity, color: "bg-orange-500", area: "Abdomen" },
  { id: "bone", name: "Orthopedics", icon: Bone, color: "bg-yellow-500", area: "Limbs" },
];

export function SymptomMapper() {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-center justify-center p-8 w-full max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold tracking-tight mb-2">Where does it hurt?</h2>
        <p className="opacity-60">Click a region to find the perfect specialist</p>
      </div>

      <div className="relative w-full max-w-md aspect-[3/4] glass rounded-[40px] p-12 flex items-center justify-center">
        {/* Simple Abstract Body Silhouette */}
        <div className="relative w-48 h-full flex flex-col items-center justify-between py-4">
          {/* Head Area */}
          <div className="relative w-20 h-20 rounded-full bg-surface-200 dark:bg-surface-300" />

          {/* Torso Area */}
          <div className="relative w-32 h-48 rounded-3xl bg-surface-200 dark:bg-surface-300 mt-2" />

          {/* Legs Area */}
          <div className="relative w-24 h-32 flex justify-between mt-2">
            <div className="w-8 h-full rounded-full bg-surface-200 dark:bg-surface-300" />
            <div className="w-8 h-full rounded-full bg-surface-200 dark:bg-surface-300" />
          </div>

          {/* Interactive Hotspots */}
          {BODY_ZONES.map((zone, idx) => (
            <motion.button
              key={zone.id}
              onClick={() => setSelectedZone(zone.id)}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              className={cn(
                "absolute z-10 w-6 h-6 rounded-full border-2 border-white shadow-lg transition-all",
                zone.color,
                selectedZone === zone.id ? "ring-4 ring-brand-primary scale-125" : "opacity-80"
              )}
              style={{
                left: "50%",
                top: `${(idx * 11) + 5}%`,
                transform: "translateX(-50%)"
              }}
            />
          ))}
        </div>

        {/* Selection Indicator */}
        <AnimatePresence mode="wait">
          {selectedZone && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="absolute right-[-160px] top-1/2 -translate-y-1/2 w-48 glass p-6 rounded-3xl"
            >
              <div className="flex flex-col items-start">
                <div className={cn("p-3 rounded-2xl mb-4 text-white", BODY_ZONES.find(z => z.id === selectedZone)?.color)}>
                  {React.createElement(BODY_ZONES.find(z => z.id === selectedZone)?.icon as any, { className: "w-6 h-6" })}
                </div>
                <h4 className="font-bold text-xl mb-1">{BODY_ZONES.find(z => z.id === selectedZone)?.name}</h4>
                <p className="text-xs opacity-60 mb-4">We recommend a specialist in this field for your symptoms.</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full py-2 bg-brand-primary text-white text-xs font-bold rounded-full"
                >
                  Find Doctor
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
