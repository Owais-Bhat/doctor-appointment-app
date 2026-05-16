"use client";

import React from 'react';
import { Calendar, FileText, Pill, Activity, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type TimelineEvent = {
  id: string;
  date: string;
  type: 'visit' | 'prescription' | 'note' | 'vitals';
  title: string;
  description: string;
  status?: string;
};

export function HealthTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="relative space-y-8 before:absolute before:left-4 before:top-0 before:bottom-0 before:w-0.5 before:bg-surface-300">
      {events.map((event, index) => (
        <div key={event.id} className="relative pl-12 group">
          {/* Timeline Dot */}
          <div className={cn(
            "absolute left-0 top-1 w-8 h-8 rounded-full border-4 border-surface-100 flex items-center justify-center z-10 transition-all group-hover:scale-110",
            event.type === 'visit' ? "bg-brand-primary text-white" :
            event.type === 'prescription' ? "bg-green-500 text-white" :
            event.type === 'note' ? "bg-blue-500 text-white" : "bg-brand-accent text-white"
          )}>
            {event.type === 'visit' && <Calendar size={14} />}
            {event.type === 'prescription' && <Pill size={14} />}
            {event.type === 'note' && <FileText size={14} />}
            {event.type === 'vitals' && <Activity size={14} />}
          </div>

          {/* Content Card */}
          <div className="p-5 bg-surface-100 rounded-3xl border border-surface-300 shadow-sm hover:shadow-md transition-all animate-in fade-in slide-in-from-left-4">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                {format(new Date(event.date), 'MMM dd, yyyy')}
              </span>
              {event.status && (
                <span className="text-[10px] px-2 py-0.5 bg-surface-200 rounded-full font-bold text-gray-500 uppercase">
                  {event.status}
                </span>
              )}
            </div>
            <h4 className="font-bold text-foreground mb-1">{event.title}</h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              {event.description}
            </p>
            {event.type === 'visit' && (
              <div className="mt-3 pt-3 border-t border-surface-300 flex items-center gap-2 text-xs text-brand-primary font-semibold cursor-pointer hover:underline">
                <FileText size={12} /> View Consultation Summary
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

