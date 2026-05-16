"use client";

import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase';
import { TrendingUp, Users, DollarSign, Activity } from 'lucide-react';

export default function SuperAdminAnalytics() {
  const { user } = useAuth();
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [growthData, setGrowthData] = useState<any[]>([]);
  const [specialtyData, setSpecialtyData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      if (!user) return;
      setIsLoading(true);
      try {
        const supabase = createClient();

        // 1. Global Revenue Trend (Mocked growth)
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        setRevenueData(months.map(m => ({ name: m, rev: Math.floor(Math.random() * 20000) + 10000 })));

        // 2. User Growth Trend
        setGrowthData(months.map(m => ({ name: m, growth: Math.floor(Math.random() * 500) + 100 })));

        // 3. Specialty Distribution
        const { data: doctors } = await supabase.from('doctor_profiles').select('specialty');
        const distribution: any = {};
        doctors?.forEach(d => {
          distribution[d.specialty] = (distribution[d.specialty] || 0) + 1;
        });
        setSpecialtyData(Object.entries(distribution).map(([name, value]) => ({ name, value })));

      } catch (err) {
        console.error("Error fetching analytics:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAnalytics();
  }, [user]);

  if (isLoading) return <div className="p-6 text-gray-500">Analyzing platform data...</div>;

  const COLORS = ['#6C63FF', '#48CFAD', '#FF6B9D', '#F4B400', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold">Platform Analytics</h1>
          <p className="text-gray-500">Comprehensive growth and revenue metrics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Global Revenue Area Chart */}
        <div className="p-6 bg-surface-100 rounded-3xl border border-surface-300 shadow-sm space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <DollarSign className="text-green-500" size={20} />
            Total Platform Revenue
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <Tooltip contentStyle={{ borderRadius: '12px' }} />
                <Area type="monotone" dataKey="rev" stroke="#6C63FF" fill="#6C63FF" fillOpacity={0.2} strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Growth Bar Chart */}
        <div className="p-6 bg-surface-100 rounded-3xl border border-surface-300 shadow-sm space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Users className="text-blue-500" size={20} />
            New User Growth
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '12px' }} />
                <Bar dataKey="growth" fill="#6C63FF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="p-6 bg-surface-100 rounded-3xl border border-surface-300 shadow-sm space-y-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Activity className="text-brand-accent" size={20} />
          Specialty Distribution
        </h3>
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="h-80 w-full max-w-md">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={specialtyData}
                  innerRadius={80}
                  outerRadius={110}
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
          </div>
          <div className="flex-1 grid grid-cols-2 gap-4">
            {specialtyData.map((entry, i) => (
              <div key={entry.name} className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-surface-300">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <div>
                  <p className="text-xs text-gray-500 font-medium">{entry.name}</p>
                  <p className="text-sm font-bold">{entry.value} Doctors</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
