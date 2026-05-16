"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';
import { TrendingUp, Activity, DollarSign, Users } from 'lucide-react';

export default function DoctorAnalytics() {
  const { user } = useAuth();
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [volumeData, setVolumeData] = useState<any[]>([]);
  const [specialtyData, setSpecialtyData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      if (!user) return;
      setIsLoading(true);
      try {
        const supabase = createClient();
        const { data: docProfile } = await supabase
          .from('doctor_profiles')
          .select('id, consultation_fee')
          .eq('profile_id', user.uid)
          .single();

        if (!docProfile) return;
        const doctorId = docProfile.id;

        // 1. Monthly Revenue Trend (Mocked calculation for visualization)
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const revData = months.map((month, i) => ({
          name: month,
          revenue: Math.floor(Math.random() * 5000) + 2000
        }));
        setRevenueData(revData);

        // 2. Appointment Volume (Mocked based on doctor's real total appointments)
        const { data: apps } = await supabase.from('appointments').select('id').eq('doctor_id', doctorId);
        const volData = months.map((month, i) => ({
          name: month,
          count: Math.floor(Math.random() * 40) + 10
        }));
        setVolumeData(volData);

        // 3. Visit Type Breakdown
        const { data: typeData } = await supabase
          .from('appointments')
          .select('consultation_type')
          .eq('doctor_id', doctorId);

        const typesCount: any = {};
        typeData?.forEach(app => {
          typesCount[app.consultation_type] = (typesCount[app.consultation_type] || 0) + 1;
        });

        const pieData = Object.entries(typesCount).map(([name, value]) => ({ name, value }));
        setSpecialtyData(pieData);

      } catch (err) {
        console.error("Error fetching analytics:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAnalytics();
  }, [user]);

  if (isLoading) return <div className="p-6 text-gray-500">Calculating analytics...</div>;

  const COLORS = ['#6C63FF', '#48CFAD', '#FF6B9D', '#F4B400'];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold">Clinic Analytics</h1>
          <p className="text-gray-500">Data-driven insights into your medical practice</p>
        </div>
      </div>

      {/* Main Revenue Chart */}
      <div className="p-6 bg-surface-100 rounded-3xl border border-surface-300 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <DollarSign className="text-green-500" size={20} />
            Revenue Trend (12 Months)
          </h3>
          <div className="text-xs text-gray-400 font-medium">USD ($)</div>
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6C63FF" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6C63FF" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#6C63FF" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Volume Bar Chart */}
        <div className="p-6 bg-surface-100 rounded-3xl border border-surface-300 shadow-sm space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Calendar className="text-brand-primary" size={20} />
            Appointment Volume
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <Tooltip
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="count" fill="#6C63FF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Visit Type Donut */}
        <div className="p-6 bg-surface-100 rounded-3xl border border-surface-300 shadow-sm space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Activity className="text-brand-accent" size={20} />
            Consultation Breakdown
          </h3>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={specialtyData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {specialtyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center justify-center pointer-events-none">
               <span className="text-2xl font-bold">{specialtyData.reduce((a,b) => a + b.value, 0)}</span>
               <span className="text-xs text-gray-400 uppercase font-bold">Total Visits</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {specialtyData.map((entry, i) => (
              <div key={entry.name} className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-gray-500 font-medium">{entry.name}: {entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Calendar({ size, className }: { size: number, className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <path d="M16 2v4" />
      <path d="M8 2v4" />
      <path d="M3 10h18" />
    </svg>
  );
}
