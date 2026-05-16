"use client";

import React, { useState, useEffect } from 'react';
import { Search, Filter, Star, DollarSign, Calendar } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { DoctorCard } from '@/components/booking/DoctorCard';

export default function DoctorSearch() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    specialty: '',
    minRating: 0,
    maxFee: 5000,
  });

  useEffect(() => {
    async function fetchDoctors() {
      setLoading(true);
      try {
        const supabase = createClient();
        let query = supabase
          .from('doctor_profiles')
          .select('*, profiles(*)')
          .eq('is_verified', true);

        if (filters.specialty) {
          query = query.ilike('specialty', `%${filters.specialty}%`);
        }
        if (filters.minRating > 0) {
          query = query.gte('rating', filters.minRating);
        }
        if (filters.maxFee < 5000) {
          query = query.lte('consultation_fee', filters.maxFee);
        }

        const { data } = await query;
        setDoctors(data || []);
      } catch (err) {
        console.error("Error fetching doctors:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDoctors();
  }, [filters]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Find Your Specialist</h1>
          <p className="text-gray-500">Search through our verified network of doctors</p>
        </div>
        <div className="flex items-center gap-2 p-1 bg-surface-100 border border-surface-300 rounded-xl">
          <Filter size={18} className="ml-2 text-gray-400" />
          <span className="text-sm font-medium px-2">Filters</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filter Sidebar */}
        <div className="space-y-6 p-6 bg-surface-100 rounded-3xl border border-surface-300 h-fit">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold mb-2 block">Specialty</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="e.g. Cardiology"
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-200 border-transparent focus:ring-2 focus:ring-brand-primary outline-none text-sm"
                  value={filters.specialty}
                  onChange={(e) => setFilters({ ...filters, specialty: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block flex items-center gap-2">
                <Star size={14} className="text-yellow-500" /> Minimum Rating
              </label>
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                className="w-full accent-brand-primary"
                value={filters.minRating}
                onChange={(e) => setFilters({ ...filters, minRating: parseFloat(e.target.value) })}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0★</span>
                <span>{filters.minRating}★</span>
                <span>5★</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block flex items-center gap-2">
                <DollarSign size={14} className="text-green-500" /> Max Fee
              </label>
              <input
                type="number"
                className="w-full p-2 rounded-xl bg-surface-200 border-transparent focus:ring-2 focus:ring-brand-primary outline-none text-sm"
                value={filters.maxFee}
                onChange={(e) => setFilters({ ...filters, maxFee: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
        </div>

        {/* Results Grid */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-12 text-gray-500">Searching for doctors...</div>
          ) : doctors.length > 0 ? (
            doctors.map((doc) => (
              <DoctorCard key={doc.id} doctor={doc} />
            ))
          ) : (
            <div className="col-span-full text-center py-12 bg-surface-100 rounded-3xl border border-dashed border-surface-300">
              <p className="text-gray-500">No doctors match your criteria. Try adjusting your filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
