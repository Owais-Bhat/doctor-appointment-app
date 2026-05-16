"use client";

import React from 'react';
import { Star, Calendar, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function DoctorCard({ doctor }: { doctor: any }) {
  return (
    <div className="group p-5 bg-surface-100 rounded-3xl border border-surface-300 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-16 h-16 rounded-2xl bg-surface-200 overflow-hidden shrink-0">
          {doctor.image_url ? (
            <img src={doctor.image_url} alt={doctor.profiles?.full_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">
              {doctor.profiles?.full_name?.[0] || 'D'}
            </div>
          )}
        </div>
        <div className="overflow-hidden">
          <h3 className="font-bold text-foreground truncate">{doctor.profiles?.full_name}</h3>
          <p className="text-sm text-brand-primary font-medium">{doctor.specialty}</p>
          <div className="flex items-center gap-1 mt-1">
            <Star size={14} className="fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-bold">{doctor.rating}</span>
            <span className="text-xs text-gray-400 ml-1">({doctor.total_reviews} reviews)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-3 bg-surface-200 rounded-xl">
          <p className="text-[10px] text-gray-500 uppercase font-bold">Experience</p>
          <p className="text-sm font-semibold">{doctor.experience_years} Years</p>
        </div>
        <div className="p-3 bg-surface-200 rounded-xl">
          <p className="text-[10px] text-gray-500 uppercase font-bold">Fee</p>
          <p className="text-sm font-semibold">${doctor.consultation_fee}</p>
        </div>
      </div>

      <Link
        href={`/client/doctors/${doctor.id}`}
        className="flex items-center justify-center w-full p-3 bg-brand-primary text-white rounded-xl font-semibold hover:bg-brand-primary/90 transition-colors group-hover:gap-3 gap-2 transition-all"
      >
        Book Appointment
        <ChevronRight size={16} />
      </Link>
    </div>
  );
}
