"use client";

import React, { useState } from 'react';
import { SymptomMapper } from '@/components/booking/SymptomMapper';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';

export default function TenantBookPage() {
  const [specialty, setSpecialty] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const doctorId = params.doctorId as string;

  const handleSpecialtySelect = (spec: string) => {
    setSpecialty(spec);
    // Directly book for this doctor instead of routing to a marketplace
    router.push(`/book/${doctorId}/confirm?specialty=${encodeURIComponent(spec)}`);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-12">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">Smart Booking Intake</h1>
        <p className="text-gray-500">You are booking an appointment with Provider ID: {doctorId}</p>
      </div>

      <SymptomMapper onSelectSpecialty={handleSpecialtySelect} />

      <div className="bg-surface-100 p-6 rounded-3xl border border-surface-300 flex items-center gap-4">
        <div className="p-3 bg-brand-primary/10 rounded-2xl text-brand-primary">
          <div className="w-6 h-6 bg-brand-primary rounded-full animate-pulse" />
        </div>
        <p className="text-sm text-gray-600">
          <strong>Pro Tip:</strong> Use the 3D model above to pinpoint your exact discomfort before confirming.
        </p>
      </div>
    </div>
  );
}
