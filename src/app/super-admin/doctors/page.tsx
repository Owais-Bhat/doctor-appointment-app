"use client";

import React, { useState, useEffect } from 'react';
import { Check, X, FileText, Eye, UserCheck, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

export default function DoctorApprovalPage() {
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);

  useEffect(() => {
    async function fetchPending() {
      setIsLoading(true);
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('doctor_profiles')
          .select('*, profiles(*)')
          .eq('is_verified', false)
          .order('created_at', { ascending: true });
        setPendingDoctors(data || []);
      } catch (err) {
        console.error("Error fetching pending doctors:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPending();
  }, []);

  const handleVerify = async (id: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('doctor_profiles')
        .update({ is_verified: true })
        .eq('id', id);

      if (error) throw error;

      setPendingDoctors(prev => prev.filter(d => d.id !== id));
      toast.success("Doctor verified successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to verify doctor");
    }
  };

  const handleReject = async (id: string, reason: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('doctor_profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPendingDoctors(prev => prev.filter(d => d.id !== id));
      toast.error(`Doctor rejected: ${reason}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to reject doctor");
    }
  };

  if (isLoading) return <div className="p-6 text-gray-500">Loading applications...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Doctor Verifications</h1>
          <p className="text-gray-500">Review credentials and approve new practitioners</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {pendingDoctors.length > 0 ? (
            pendingDoctors.map(doc => (
              <div
                key={doc.id}
                className="p-4 bg-surface-100 rounded-2xl border border-surface-300 flex items-center justify-between group hover:border-brand-primary transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-surface-200 overflow-hidden shrink-0">
                    {doc.image_url ? <img src={doc.image_url} alt="Avatar" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">DR</div>}
                  </div>
                  <div>
                    <p className="font-bold">{doc.profiles?.full_name}</p>
                    <p className="text-xs text-gray-500">{doc.specialty} • {doc.experience_years}y exp</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedDoctor(doc)}
                    className="p-2 text-gray-400 hover:text-brand-primary transition-colors"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => handleVerify(doc.id)}
                    className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                  >
                    <Check size={18} />
                  </button>
                  <button
                    onClick={() => handleReject(doc.id, 'Insufficient credentials')}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center bg-surface-100 rounded-3xl border-2 border-dashed border-surface-300 text-gray-500">
              <p>No pending doctor applications to review.</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {selectedDoctor ? (
            <div className="p-6 bg-surface-100 rounded-3xl border border-surface-300 shadow-xl space-y-6 animate-in slide-in-from-right-4">
              <h3 className="text-xl font-bold mb-4">Application Detail</h3>
              <div className="space-y-4">
                <div className="p-4 bg-white rounded-2xl border border-surface-300">
                  <p className="text-xs font-bold text-gray-400 uppercase">Full Name</p>
                  <p className="font-medium">{selectedDoctor.profiles?.full_name}</p>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-surface-300">
                  <p className="text-xs font-bold text-gray-400 uppercase">Specialty</p>
                  <p className="font-medium">{selectedDoctor.specialty}</p>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-surface-300">
                  <p className="text-xs font-bold text-gray-400 uppercase">Qualifications</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedDoctor.qualifications?.map((q: string) => (
                      <span key={q} className="px-2 py-1 bg-surface-200 rounded-lg text-[10px] font-bold">{q}</span>
                    ))}
                  </div>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-surface-300">
                  <p className="text-xs font-bold text-gray-400 uppercase">Clinic Address</p>
                  <p className="font-medium">{selectedDoctor.clinic_address || 'Not provided'}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => handleVerify(selectedDoctor.id)}
                  className="flex-1 p-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-all flex items-center justify-center gap-2"
                >
                  <UserCheck size={18} /> Approve
                </button>
                <button
                  onClick={() => handleReject(selectedDoctor.id, 'Credentials not verified')}
                  className="flex-1 p-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                >
                  <X size={18} /> Reject
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 bg-surface-100 rounded-3xl border-2 border-dashed border-surface-300 text-center text-gray-400">
              <p>Select a doctor to view full credentials</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
