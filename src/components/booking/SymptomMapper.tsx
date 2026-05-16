"use client";

import React, { useState } from 'react';
import { ChevronRight, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

import { HumanModel3D } from './HumanModel3D';

const REGIONS = [
  {
    id: 'head',
    name: 'Head & Neck',
    specialties: ['Neurologist', 'ENT Specialist', 'Ophthalmologist', 'Dentist'],
    path: "M 50,20 C 40,10 60,10 50,20 Z" // Simplified path
  },
  {
    id: 'chest',
    name: 'Chest & Heart',
    specialties: ['Cardiologist', 'Pulmonologist'],
    path: "M 40,30 L 60,30 L 60,50 L 40,50 Z"
  },
  {
    id: 'abdomen',
    name: 'Abdomen & Digestive',
    specialties: ['Gastroenterologist', 'General Surgeon'],
    path: "M 40,50 L 60,50 L 60,70 L 40,70 Z"
  },
  {
    id: 'limbs',
    name: 'Joints & Limbs',
    specialties: ['Orthopedic Surgeon', 'Physiotherapist'],
    path: "M 30,70 L 40,70 L 40,90 L 30,90 Z M 60,70 L 70,70 L 70,90 L 60,90 Z"
  }
];

export function SymptomMapper({ onSelectSpecialty }: { onSelectSpecialty: (s: string) => void }) {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  return (
    <div className="flex flex-col md:flex-row gap-8 items-center justify-center p-8 bg-surface-100 rounded-3xl border border-surface-300">
      <div className="relative w-80 h-[500px] bg-gradient-to-b from-surface-200 to-surface-100 rounded-[3rem] flex items-center justify-center overflow-hidden border-4 border-white shadow-inner">
        {/* Interactive 3D Hologram Model */}
        <div className="absolute inset-0">
          <HumanModel3D selectedRegion={selectedRegion} onSelectRegion={setSelectedRegion} />
        </div>
      </div>

      <div className="flex-1 max-w-md space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Where is the discomfort?</h2>
          <p className="text-gray-500">Tap the affected area on the body map to find the right specialist.</p>
        </div>

        {selectedRegion ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div className="p-4 bg-brand-primary/10 rounded-2xl border border-brand-primary/20">
              <p className="text-sm font-semibold text-brand-primary mb-1">Selected Region</p>
              <p className="text-lg font-bold">{REGIONS.find(r => r.id === selectedRegion)?.name}</p>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <p className="text-sm font-medium text-gray-500 mb-1">Recommended Specialists:</p>
              {REGIONS.find(r => r.id === selectedRegion)?.specialties.map(spec => (
                <button
                  key={spec}
                  onClick={() => onSelectSpecialty(spec)}
                  className="flex items-center justify-between p-3 bg-white border border-surface-300 rounded-xl hover:border-brand-primary hover:bg-brand-primary/5 transition-all text-left group"
                >
                  <span className="font-medium">{spec}</span>
                  <ChevronRight size={16} className="text-gray-400 group-hover:text-brand-primary transition-colors" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-8 border-2 border-dashed border-surface-300 rounded-3xl text-center text-gray-400">
            <p>Please select a body region to see recommended specialists</p>
          </div>
        )}
      </div>
    </div>
  );
}

function UserCircle({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
