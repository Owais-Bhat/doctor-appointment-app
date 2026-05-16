"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase';
import { Search, User, FileText, Save, History, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

export default function PatientsPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [clinicalNote, setClinicalNote] = useState('');

  useEffect(() => {
    async function fetchPatients() {
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

        // Fetch unique patients who have booked with this doctor
        const { data: appointments } = await supabase
          .from('appointments')
          .select('patient_id, profiles(*)')
          .eq('doctor_id', docProfile.id);

        // Deduplicate patients
        const uniquePatients = Array.from(
          new Map(appointments?.map(app => [app.patient_id, app.profiles]).values())
        );

        setPatients(uniquePatients);
      } catch (err) {
        console.error("Error fetching patients:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPatients();
  }, [user]);

  const selectPatient = async (patientId: string) => {
    const supabase = createClient();
    const { data: patient } = await supabase.from('profiles').select('*').eq('id', patientId).single();

    const { data: history } = await supabase
      .from('appointments')
      .select('*, doctor_profiles(*)')
      .eq('patient_id', patientId)
      .order('appointment_date', { ascending: false });

    setSelectedPatient({ ...patient, history });
  };

  const saveNote = async (appointmentId: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('appointments')
      .update({ notes: clinicalNote })
      .eq('id', appointmentId);

    if (error) {
      toast.error("Failed to save note");
    } else {
      toast.success("Medical note saved");
      setClinicalNote('');
    }
  };

  const filteredPatients = patients.filter(p =>
    p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) return <div className="p-6 text-gray-500">Loading patient records...</div>;

  return (
    <div className="flex h-full gap-6">
      {/* Patient List Table */}
      <div className="flex-1 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Patient Records</h1>
          <div className="relative w-64">
            <Search className="absolute left-3 top-3 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search patients..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-100 border border-surface-300 outline-none focus:ring-2 focus:ring-brand-primary text-sm"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-surface-100 rounded-3xl border border-surface-300 overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-200 text-gray-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="px-6 py-4">Patient</th>
                <th className="px-6 py-4">Blood Type</th>
                <th className="px-6 py-4">Last Visit</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-300">
              {filteredPatients.map(p => (
                <tr
                  key={p.id}
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-brand-primary/5",
                    selectedPatient?.id === p.id ? "bg-brand-primary/10" : ""
                  )}
                  onClick={() => selectPatient(p.id)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-200 flex items-center justify-center font-bold text-xs">
                        {p.full_name?.[0]}
                      </div>
                      <span className="font-semibold">{p.full_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">{p.blood_type || 'N/A'}</td>
                  <td className="px-6 py-4 text-gray-500">---</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-brand-primary font-bold hover:underline">View File</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Patient Detail Panel */}
      {selectedPatient && (
        <div className="w-96 p-6 bg-surface-100 rounded-3xl border border-surface-300 shadow-xl space-y-6 animate-in slide-in-from-right-4">
          <div className="text-center space-y-2">
            <div className="w-20 h-20 rounded-full bg-surface-200 mx-auto mb-2 overflow-hidden border-4 border-white">
              {selectedPatient.avatar_url ? <img src={selectedPatient.avatar_url} alt="Avatar" /> : <User size={40} className="m-3 text-gray-400" />}
            </div>
            <h2 className="text-xl font-bold">{selectedPatient.full_name}</h2>
            <p className="text-sm text-gray-500">{selectedPatient.email}</p>
          </div>

          <div className="p-4 bg-surface-200 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold uppercase text-gray-400 flex items-center gap-2">
              <Activity size={12} /> Health Vitals
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-white rounded-lg border border-surface-300">
                <p className="text-[10px] text-gray-500">Blood Type</p>
                <p className="text-sm font-bold">{selectedPatient.blood_type || 'N/A'}</p>
              </div>
              <div className="p-2 bg-white rounded-lg border border-surface-300">
                <p className="text-xs text-gray-500">Gender</p>
                <p className="text-sm font-bold">{selectedPatient.gender || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase text-gray-400 flex items-center gap-2">
              <History size={12} /> Visit History
            </h3>
            <div className="space-y-3 overflow-y-auto max-h-64 pr-2">
              {selectedPatient.history?.map((app: any) => (
                <div key={app.id} className="p-3 bg-white border border-surface-300 rounded-xl space-y-2 group">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-bold">{format(new Date(app.appointment_date), 'MMM dd, yyyy')}</p>
                    <span className="text-[10px] px-2 py-0.5 bg-surface-200 rounded-full font-medium">{app.status}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText size={12} className="text-gray-400" />
                    <textarea
                      className="w-full text-xs p-2 bg-surface-200 border-transparent rounded-lg outline-none focus:ring-1 focus:ring-brand-primary"
                      placeholder="Add clinical note..."
                      value={app.notes || ''}
                      onChange={(e) => {
                        const newNotes = e.target.value;
                        // Update local state for the specific appointment in the list
                        const updatedHistory = selectedPatient.history.map((h: any) =>
                          h.id === app.id ? { ...h, notes: newNotes } : h
                        );
                        setSelectedPatient({ ...selectedPatient, history: updatedHistory });
                        setClinicalNote(newNotes); // for the save button (simplified logic)
                      }}
                    />
                  </div>
                  <button
                    onClick={() => saveNote(app.id)}
                    className="w-full py-1.5 bg-brand-primary text-white rounded-lg text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Save Note
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Activity({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
