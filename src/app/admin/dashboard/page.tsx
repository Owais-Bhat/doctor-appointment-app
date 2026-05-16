"use client";

import React, { useEffect, useState } from 'react';
import { Calendar, Users, DollarSign, Star, TrendingUp } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase';
import { format } from 'date-fns';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    todayAppointments: 0,
    monthlyRevenue: 0,
    avgRating: 0,
    totalPatients: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDoctorStats() {
      if (!user) return;
      setIsLoading(true);
      try {
        const supabase = createClient();

        // 1. Get the doctor_profile_id for the current user
        const { data: docProfile } = await supabase
          .from('doctor_profiles')
          .select('id, consultation_fee')
          .eq('profile_id', user.uid)
          .single();

        if (!docProfile) return;

        const doctorId = docProfile.id;

        // 2. Today's Appointments
        const today = format(new Date(), 'yyyy-MM-dd');
        const { count: todayCount } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('doctor_id', doctorId)
          .eq('appointment_date', today);

        // 3. Monthly Revenue (Confirmed + Completed appointments * fee)
        const startOfMonth = format(new Date(new Date().setDate(1)), 'yyyy-MM-dd');
        const { data: monthlyApps } = await supabase
          .from('appointments')
          .select('status')
          .eq('doctor_id', doctorId)
          .gte('appointment_date', startOfMonth);

        const completedCount = monthlyApps?.filter(app =>
          ['confirmed', 'completed'].includes(app.status)
        ).length || 0;
        const revenue = completedCount * (docProfile.consultation_fee || 0);

        // 4. Average Rating
        const { data: reviews } = await supabase
          .from('reviews')
          .select('rating')
          .eq('doctor_id', doctorId);

        const avgRating = reviews && reviews.length > 0
          ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length
          : 0;

        // 5. Total Patients
        const { count: patientCount } = await supabase
          .from('appointments')
          .select('patient_id', { count: 'exact', head: true })
          .eq('doctor_id', doctorId);

        setStats({
          todayAppointments: todayCount || 0,
          monthlyRevenue: revenue,
          avgRating: parseFloat(avgRating.toFixed(1)),
          totalPatients: patientCount || 0,
        });
      } catch (error) {
        console.error("Error fetching doctor stats:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDoctorStats();
  }, [user]);

  if (isLoading) return <div className="p-6 text-gray-500">Loading clinic statistics...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold">Clinic Overview</h1>
          <p className="text-gray-500">Welcome back, Dr. {user?.displayName?.split(' ')[0] || 'Specialist'}</p>
        </div>
        <div className="text-sm font-medium text-gray-400">
          {format(new Date(), 'EEEE, MMMM dd')}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Today's Patients"
          value={stats.todayAppointments}
          icon={Calendar}
          color="text-brand-primary"
          bg="bg-brand-primary/10"
        />
        <KPICard
          title="Monthly Revenue"
          value={`$${stats.monthlyRevenue.toLocaleString()}`}
          icon={DollarSign}
          color="text-green-600"
          bg="bg-green-100"
        />
        <KPICard
          title="Avg. Patient Rating"
          value={`${stats.avgRating} ★`}
          icon={Star}
          color="text-yellow-500"
          bg="bg-yellow-100"
        />
        <KPICard
          title="Total Patients"
          value={stats.totalPatients}
          icon={Users}
          color="text-blue-600"
          bg="bg-blue-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 bg-surface-100 rounded-3xl border border-surface-300 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Recent Activity</h3>
            <button className="text-sm text-brand-primary font-semibold hover:underline">View All Appointments</button>
          </div>
          <div className="text-center py-12 text-gray-400 border-2 border-dashed border-surface-300 rounded-2xl">
            <p>Appointment pipeline will be displayed here.</p>
            <p className="text-xs mt-1">Currently implementing Kanban board...</p>
          </div>
        </div>

        <div className="p-6 bg-surface-100 rounded-3xl border border-surface-300 shadow-sm space-y-4">
          <h3 className="text-xl font-bold mb-4">Clinic Health</h3>
          <div className="p-4 bg-surface-200 rounded-2xl space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Patient Retention</span>
              <span className="text-sm font-bold">84%</span>
            </div>
            <div className="w-full bg-gray-300 h-2 rounded-full overflow-hidden">
              <div className="bg-brand-primary h-full" style={{ width: '84%' }} />
            </div>
          </div>
          <div className="p-4 bg-surface-200 rounded-2xl space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Average Visit Duration</span>
              <span className="text-sm font-bold">28 min</span>
            </div>
            <div className="w-full bg-gray-300 h-2 rounded-full overflow-hidden">
              <div className="bg-green-500 h-full" style={{ width: '70%' }} />
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-brand-primary/5 rounded-2xl border border-brand-primary/20">
            <TrendingUp size={20} className="text-brand-primary" />
            <p className="text-xs text-gray-600">Revenue is up 12% compared to last month.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, icon: Icon, color, bg }: any) {
  return (
    <div className="p-6 bg-surface-100 rounded-3xl border border-surface-300 shadow-sm transition-transform hover:scale-105">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 ${bg} ${color} rounded-2xl`}>
          <Icon size={24} />
        </div>
      </div>
      <p className="text-gray-500 text-sm font-medium">{title}</p>
      <h3 className="text-3xl font-bold mt-1">{value}</h3>
    </div>
  );
}
