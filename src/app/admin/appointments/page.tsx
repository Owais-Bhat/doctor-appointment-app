"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase';
import { GripVertical, User, Calendar, Clock, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

type Column = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

const COLUMNS: { id: Column; label: string; color: string }[] = [
  { id: 'pending', label: 'Pending', color: 'bg-yellow-500' },
  { id: 'confirmed', label: 'Confirmed', color: 'bg-blue-500' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-purple-500' },
  { id: 'completed', label: 'Completed', color: 'bg-green-500' },
  { id: 'cancelled', label: 'Cancelled', color: 'bg-red-500' },
];

export default function AppointmentKanban() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAppointments() {
      if (!user) return;
      setIsLoading(true);
      try {
        const supabase = createClient();
        const { data: docProfile } = await supabase
          .from('doctor_profiles')
          .select('id')
          .eq('profile_id', user.uid)
          .single();

        if (!docProfile) return;

        const { data } = await supabase
          .from('appointments')
          .select('*, profiles(*)')
          .eq('doctor_id', docProfile.id)
          .order('appointment_date', { ascending: true });

        setAppointments(data || []);
      } catch (err) {
        console.error("Error fetching appointments:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAppointments();
  }, [user]);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setAppointments(prev => prev.map(app => app.id === id ? { ...app, status: newStatus } : app));
      toast.success(`Appointment marked as ${newStatus}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  if (isLoading) return <div className="p-6 text-gray-500">Loading appointment pipeline...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Appointment Pipeline</h1>
          <p className="text-gray-500">Drag and drop to manage patient flow</p>
        </div>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-6 no-scrollbar h-[calc(100vh-200px)]">
        {COLUMNS.map(col => (
          <div key={col.id} className="flex-shrink-0 w-80 flex flex-col">
            <div className="flex items-center gap-2 mb-4 px-2">
              <div className={cn("w-3 h-3 rounded-full", col.color)} />
              <h3 className="font-bold text-foreground">{col.label}</h3>
              <span className="ml-auto text-xs font-bold text-gray-400 bg-surface-200 px-2 py-1 rounded-full">
                {appointments.filter(a => a.status === col.id).length}
              </span>
            </div>

            <div className="flex-1 space-y-4 p-2 bg-surface-200/50 rounded-3xl border-2 border-dashed border-surface-300 overflow-y-auto">
              {appointments
                .filter(app => app.status === col.id)
                .map(app => (
                  <AppointmentCard
                    key={app.id}
                    app={app}
                    onStatusChange={updateStatus}
                  />
                ))}
              {appointments.filter(a => a.status === col.id).length === 0 && (
                <div className="p-8 text-center text-gray-400 text-sm">
                  No appointments in this stage
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AppointmentCard({ app, onStatusChange }: { app: any, onStatusChange: (id: string, status: string) => void }) {
  return (
    <div className="p-4 bg-surface-100 rounded-2xl border border-surface-300 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold">
            {app.profiles?.full_name?.[0] || 'P'}
          </div>
          <div>
            <p className="font-bold text-sm">{app.profiles?.full_name || 'Patient'}</p>
            <p className="text-xs text-gray-500">ID: {app.id.slice(0, 8)}</p>
          </div>
        </div>
        <button className="p-1 hover:bg-surface-200 rounded-lg text-gray-400">
          <MoreVertical size={14} />
        </button>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Calendar size={12} />
          <span>{app.appointment_date}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Clock size={12} />
          <span>{app.appointment_time}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <select
          value={app.status}
          onChange={(e) => onStatusChange(app.id, e.target.value)}
          className="w-full p-2 text-xs font-semibold bg-surface-200 border-transparent rounded-lg outline-none focus:ring-2 focus:ring-brand-primary"
        >
          {COLUMNS.map(col => (
            <option key={col.id} value={col.id}>{col.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
