"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Save, XCircle, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function SchedulePage() {
  const { user } = useAuth();
  const [availability, setAvailability] = useState<any[]>([]);
  const [blockedDates, setBlockedDates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newBlockedDate, setNewBlockedDate] = useState({ date: '', reason: '' });

  useEffect(() => {
    async function fetchSchedule() {
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

        const [availData, blockedData] = await Promise.all([
          supabase.from('doctor_availability').select('*').eq('doctor_id', docProfile.id),
          supabase.from('blocked_dates').select('*').eq('doctor_id', docProfile.id)
        ]);

        setAvailability(availData.data || []);
        setBlockedDates(blockedData.data || []);
      } catch (err) {
        console.error("Error fetching schedule:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSchedule();
  }, [user]);

  const updateAvailability = async (id: string, updates: any) => {
    const supabase = createClient();
    const { error } = await supabase.from('doctor_availability').update(updates).eq('id', id);
    if (error) {
      toast.error("Failed to update availability");
    } else {
      setAvailability(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
      toast.success("Schedule updated");
    }
  };

  const addBlockedDate = async () => {
    if (!newBlockedDate.date) return;
    const supabase = createClient();
    const { data: docProfile } = await supabase.from('doctor_profiles').select('id').eq('profile_id', user?.uid).single();

    const { error } = await supabase.from('blocked_dates').insert({
      doctor_id: docProfile?.id,
      blocked_date: newBlockedDate.date,
      reason: newBlockedDate.reason
    });

    if (error) {
      toast.error("Failed to block date");
    } else {
      setBlockedDates(prev => [...prev, { id: 'new', ...newBlockedDate }]);
      setNewBlockedDate({ date: '', reason: '' });
      toast.success("Date blocked successfully");
    }
  };

  const removeBlockedDate = async (id: string) => {
    const supabase = createClient();
    await supabase.from('blocked_dates').delete().eq('id', id);
    setBlockedDates(prev => prev.filter(d => d.id !== id));
    toast.success("Blocked date removed");
  };

  if (isLoading) return <div className="p-6 text-gray-500">Loading schedule manager...</div>;

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Schedule Management</h1>
          <p className="text-gray-500">Configure your weekly availability and holidays</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly Template */}
        <div className="lg:col-span-2 p-6 bg-surface-100 rounded-3xl border border-surface-300 shadow-sm space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Calendar className="text-brand-primary" size={20} />
            Weekly Availability
          </h3>

          <div className="space-y-4">
            {days.map((day, index) => {
              const dayAvail = availability.find(a => a.day_of_week === index) || {
                id: 'new',
                start_time: '09:00',
                end_time: '17:00',
                slot_duration_minutes: 30,
                is_active: false
              };

              return (
                <div key={day} className="p-4 bg-surface-200 rounded-2xl flex flex-col md:flex-row md:items-center gap-4 transition-all hover:bg-white hover:border-brand-primary border border-transparent">
                  <div className="flex items-center gap-3 w-40">
                    <input
                      type="checkbox"
                      checked={dayAvail.is_active}
                      onChange={(e) => updateAvailability(dayAvail.id, { is_active: e.target.checked })}
                      className="w-4 h-4 accent-brand-primary"
                    />
                    <span className="font-bold text-sm">{day}</span>
                  </div>

                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="time"
                      value={dayAvail.start_time}
                      onChange={(e) => updateAvailability(dayAvail.id, { start_time: e.target.value })}
                      className="p-2 rounded-lg bg-white border-transparent text-xs font-bold outline-none"
                    />
                    <span className="text-gray-400 text-xs">to</span>
                    <input
                      type="time"
                      value={dayAvail.end_time}
                      onChange={(e) => updateAvailability(dayAvail.id, { end_time: e.target.value })}
                      className="p-2 rounded-lg bg-white border-transparent text-xs font-bold outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Slot:</span>
                    <select
                      value={dayAvail.slot_duration_minutes}
                      onChange={(e) => updateAvailability(dayAvail.id, { slot_duration_minutes: parseInt(e.target.value) })}
                      className="p-2 rounded-lg bg-white border-transparent text-xs font-bold outline-none"
                    >
                      <option value="15">15m</option>
                      <option value="30">30m</option>
                      <option value="60">60m</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Blocked Dates */}
        <div className="p-6 bg-surface-100 rounded-3xl border border-surface-300 shadow-sm space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <XCircle className="text-red-500" size={20} />
            Blocked Dates
          </h3>

          <div className="p-4 bg-surface-200 rounded-2xl space-y-3">
            <input
              type="date"
              value={newBlockedDate.date}
              onChange={e => setNewBlockedDate({ ...newBlockedDate, date: e.target.value })}
              className="w-full p-2 rounded-lg bg-white border-transparent text-sm outline-none"
            />
            <input
              type="text"
              placeholder="Reason (e.g. Vacation)"
              value={newBlockedDate.reason}
              onChange={e => setNewBlockedDate({ ...newBlockedDate, reason: e.target.value })}
              className="w-full p-2 rounded-lg bg-white border-transparent text-sm outline-none"
            />
            <button
              onClick={addBlockedDate}
              className="w-full p-2 bg-brand-primary text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Block Date
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {blockedDates.map(date => (
              <div key={date.id} className="p-3 bg-white border border-surface-300 rounded-xl flex justify-between items-center group">
                <div>
                  <p className="text-xs font-bold">{format(new Date(date.blocked_date), 'MMM dd, yyyy')}</p>
                  <p className="text-[10px] text-gray-500">{date.reason || 'No reason provided'}</p>
                </div>
                <button
                  onClick={() => removeBlockedDate(date.id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {blockedDates.length === 0 && <p className="text-center text-gray-400 text-xs py-4">No blocked dates set.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
