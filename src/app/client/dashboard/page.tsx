"use client";

import React, { useEffect, useState } from 'react';
import { Calendar, Activity, Clock, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase';
import { format } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    upcomingCount: 0,
    lastVisit: 'N/A',
    totalVisits: 0,
    healthScore: 0
  });
  const [nextAppointment, setNextAppointment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) return;

      try {
        const supabase = createClient();

        // 1. Fetch Upcoming Appointments
        const { data: upcoming } = await supabase
          .from('appointments')
          .select('*, doctor_profiles(*)')
          .eq('patient_id', user.uid)
          .eq('status', 'confirmed')
          .gt('appointment_date', new Date().toISOString().split('T')[0])
          .order('appointment_date', { ascending: true });

        // 2. Fetch All Visits for stats
        const { count: totalVisits } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('patient_id', user.uid);

        // 3. Fetch Last Visit
        const { data: lastVisitData } = await supabase
          .from('appointments')
          .select('appointment_date')
          .eq('patient_id', user.uid)
          .order('appointment_date', { ascending: false })
          .limit(1)
          .single();

        // 4. Fetch Profile Health Stats
        const { data: profile } = await supabase
          .from('profiles')
          .select('health_stats')
          .eq('id', user.uid)
          .single();

        setStats({
          upcomingCount: upcoming?.length || 0,
          lastVisit: lastVisitData ? format(new Date(lastVisitData.appointment_date), 'MMM dd, yyyy') : 'N/A',
          totalVisits: totalVisits || 0,
          healthScore: profile?.health_stats?.score || 0
        });

        if (upcoming && upcoming.length > 0) {
          setNextAppointment(upcoming[0]);
        }
      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, [user]);

  if (isLoading) {
    return <div className="p-6 text-gray-500">Loading health overview...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold">Patient Dashboard</h1>
          <p className="text-gray-500">Welcome back to your health overview</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Upcoming Appointments"
          value={stats.upcomingCount}
          icon={Calendar}
          color="text-brand-primary"
          bg="bg-brand-primary/10"
        />
        <StatCard
          title="Last Visit"
          value={stats.lastVisit}
          icon={Clock}
          color="text-blue-500"
          bg="bg-blue-500/10"
        />
        <StatCard
          title="Total Visits"
          value={stats.totalVisits}
          icon={Activity}
          color="text-green-500"
          bg="bg-green-500/10"
        />
        <StatCard
          title="Health Score"
          value={`${stats.healthScore}%`}
          icon={User}
          color="text-brand-accent"
          bg="bg-brand-accent/10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 bg-surface-100 rounded-3xl border border-surface-300 shadow-sm">
          <h3 className="text-xl font-bold mb-4">Next Appointment</h3>
          {nextAppointment ? (
            <div className="flex items-center justify-between p-4 bg-surface-200 rounded-2xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-brand-primary flex items-center justify-center text-white font-bold">
                  {nextAppointment.doctor_profiles?.specialty[0] || 'D'}
                </div>
                <div>
                  <p className="font-bold">{nextAppointment.doctor_profiles?.full_name || 'Specialist'}</p>
                  <p className="text-sm text-gray-500">{nextAppointment.doctor_profiles?.specialty}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold">{format(new Date(nextAppointment.appointment_date), 'MMM dd')}</p>
                <p className="text-sm text-gray-500">{nextAppointment.appointment_time}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No upcoming appointments scheduled.</p>
          )}
        </div>

        <div className="p-6 bg-surface-100 rounded-3xl border border-surface-300 shadow-sm">
          <h3 className="text-xl font-bold mb-4">AI Health Tip</h3>
          <div className="p-4 bg-brand-primary/5 rounded-2xl border border-brand-primary/20">
            <p className="text-sm text-gray-600 italic">
              "Based on your recent activity, maintaining a consistent sleep schedule will help improve your focus and recovery."
            </p>
            <p className="text-xs text-brand-primary mt-2 font-semibold">— Claude Health AI</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, bg }: any) {
  return (
    <div className="p-6 bg-surface-100 rounded-2xl border border-surface-300 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 ${bg} ${color} rounded-lg`}>
          <Icon size={20} />
        </div>
      </div>
      <p className="text-gray-500 text-sm">{title}</p>
      <h3 className="text-2xl font-bold">{value}</h3>
    </div>
  );
}
