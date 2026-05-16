"use client";

import React, { useState } from 'react';
import { SymptomMapper } from '@/components/booking/SymptomMapper';
import { useRouter } from 'next/navigation';

export default function BookPage() {
  const [specialty, setSpecialty] = useState<string | null>(null);
  const router = useRouter();

  const handleSpecialtySelect = (spec: string) => {
    setSpecialty(spec);
    // Directly go to doctor browser filtered by specialty
    router.push(`/client/doctors?specialty=${encodeURIComponent(spec)}`);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-12">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">Smart Booking Intake</h1>
        <p className="text-gray-500">Find the perfect specialist for your symptoms instantly</p>
      </div>

      <SymptomMapper onSelectSpecialty={handleSpecialtySelect} />

      <div className="bg-surface-100 p-6 rounded-3xl border border-surface-300 flex items-center gap-4">
        <div className="p-3 bg-brand-primary/10 rounded-2xl text-brand-primary">
          <div className="w-6 h-6 bg-brand-primary rounded-full animate-pulse" />
        </div>
        <p className="text-sm text-gray-600">
          <strong>Pro Tip:</strong> Click the 3D model regions to highlight where you're experiencing discomfort and we'll automatically route you.
        </p>
      </div>
    </div>
  );
}
