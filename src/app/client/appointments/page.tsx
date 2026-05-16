"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase';
import { format } from 'date-fns';

export default function AppointmentsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAppointments() {
      if (!user) return;
      setIsLoading(true);
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('appointments')
          .select('*, doctor_profiles(*)')
          .eq('patient_id', user.uid)
          .order('appointment_date', { ascending: 'asc' });

        setAppointments(data || []);
      } catch (err) {
        console.error("Error fetching appointments:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAppointments();
  }, [user]);

  const filteredAppointments = appointments.filter(app => {
    const isPast = new Date(app.appointment_date) < new Date();
    if (activeTab === 'upcoming') return !isPast && app.status !== 'cancelled';
    if (activeTab === 'past') return isPast && app.status === 'completed';
    if (activeTab === 'cancelled') return app.status === 'cancelled';
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Appointments</h1>
        <div className="flex p-1 bg-surface-100 rounded-xl border border-surface-300">
          {['upcoming', 'past', 'cancelled'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all",
                activeTab === tab ? "bg-white text-brand-primary shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-gray-500">Loading appointments...</div>
      ) : filteredAppointments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAppointments.map(app => (
            <div key={app.id} className="p-5 bg-surface-100 rounded-3xl border border-surface-300 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-brand-primary/10 text-brand-primary rounded-2xl">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="font-bold">{app.doctor_profiles?.full_name || 'Specialist'}</p>
                  <p className="text-sm text-gray-500">{app.doctor_profiles?.specialty}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold">{format(new Date(app.appointment_date), 'MMM dd, yyyy')}</p>
                <p className="text-sm text-gray-500 flex items-center justify-end gap-1">
                  <Clock size={12} /> {app.appointment_time}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-surface-100 rounded-3xl border-2 border-dashed border-surface-300 text-gray-500">
          No {activeTab} appointments found.
        </div>
      )}
    </div>
  );
}
