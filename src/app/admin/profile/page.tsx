"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { User, ShieldCheck, Lock, Save, Star, Briefcase, DollarSign, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function DoctorProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [canEdit, setCanEdit] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;
      setIsLoading(true);
      try {
        const supabase = createClient();
        
        // 1. Fetch Supabase Data
        const { data: docData, error: docError } = await supabase
          .from('doctor_profiles')
          .select('*, profiles(*)')
          .eq('profile_id', user.uid)
          .single();

        if (docError) throw docError;

        // 2. Fetch Permission Flag from Firestore
        const configSnap = await getDoc(doc(db, 'doctor_configs', user.email!));
        if (configSnap.exists()) {
          setCanEdit(configSnap.data().can_self_edit ?? true);
        }

        setProfile({
          ...docData,
          full_name: docData.profiles?.full_name,
          email: docData.profiles?.email
        });
      } catch (err: any) {
        console.error("Error fetching profile:", err);
        toast.error("Failed to load profile data");
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      toast.error("Editing is disabled by the administrator");
      return;
    }

    setIsSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('doctor_profiles')
        .update({
          specialty: profile.specialty,
          consultation_fee: parseFloat(profile.consultation_fee),
          experience_years: parseInt(profile.experience_years),
          bio: profile.bio
        })
        .eq('id', profile.id);

      if (error) throw error;
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-12 text-center text-gray-500 font-bold animate-pulse">Synchronizing Professional Records...</div>;
  if (!profile) return <div className="p-12 text-center text-red-500 font-bold">Error: Doctor profile record not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-brand-primary text-white rounded-[2rem] flex items-center justify-center font-black text-3xl shadow-xl shadow-brand-primary/20 border-4 border-white">
            {profile.full_name?.charAt(0)}
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-gray-900">{profile.full_name}</h1>
            <p className="text-gray-500 flex items-center gap-2 font-medium">
               <ShieldCheck size={16} className={profile.is_verified ? "text-green-500" : "text-amber-500"} />
               {profile.specialty} | {profile.email}
            </p>
          </div>
        </div>
        {!canEdit && (
          <div className="px-6 py-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-700 shadow-sm">
             <Lock size={18} />
             <span className="text-sm font-black uppercase tracking-tight">Managed by Super Admin</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-8">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={cn(
              "p-6 rounded-3xl border transition-all space-y-4",
              canEdit ? "bg-white border-surface-300 shadow-sm" : "bg-surface-100 border-surface-200 grayscale-[0.5] opacity-80"
            )}>
               <div className="p-3 bg-brand-primary/10 text-brand-primary rounded-2xl w-fit">
                  <Star size={20} />
               </div>
               <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Primary Specialty</label>
                  <input 
                    className="w-full bg-transparent font-bold text-lg outline-none disabled:cursor-not-allowed"
                    value={profile.specialty}
                    onChange={e => setProfile({...profile, specialty: e.target.value})}
                    disabled={!canEdit}
                    placeholder="e.g. Cardiology"
                  />
               </div>
            </div>

            <div className={cn(
              "p-6 rounded-3xl border transition-all space-y-4",
              canEdit ? "bg-white border-surface-300 shadow-sm" : "bg-surface-100 border-surface-200 grayscale-[0.5] opacity-80"
            )}>
               <div className="p-3 bg-brand-primary/10 text-brand-primary rounded-2xl w-fit">
                  <Briefcase size={20} />
               </div>
               <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Experience (Years)</label>
                  <input 
                    type="number"
                    className="w-full bg-transparent font-bold text-lg outline-none disabled:cursor-not-allowed"
                    value={profile.experience_years}
                    onChange={e => setProfile({...profile, experience_years: e.target.value})}
                    disabled={!canEdit}
                  />
               </div>
            </div>

            <div className={cn(
              "p-6 rounded-3xl border transition-all space-y-4",
              canEdit ? "bg-white border-surface-300 shadow-sm" : "bg-surface-100 border-surface-200 grayscale-[0.5] opacity-80"
            )}>
               <div className="p-3 bg-brand-primary/10 text-brand-primary rounded-2xl w-fit">
                  <DollarSign size={20} />
               </div>
               <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Consultation Fee ($)</label>
                  <input 
                    type="number"
                    className="w-full bg-transparent font-bold text-lg outline-none disabled:cursor-not-allowed"
                    value={profile.consultation_fee}
                    onChange={e => setProfile({...profile, consultation_fee: e.target.value})}
                    disabled={!canEdit}
                  />
               </div>
            </div>
         </div>

         <div className={cn(
           "p-8 rounded-[2.5rem] border transition-all",
           canEdit ? "bg-white border-surface-300 shadow-sm" : "bg-surface-100 border-surface-200 opacity-80"
         )}>
            <div className="flex items-center gap-3 mb-6">
               <div className="p-3 bg-surface-200 rounded-2xl">
                  <FileText size={20} className="text-gray-500" />
               </div>
               <h3 className="text-xl font-bold">Professional Biography</h3>
            </div>
            <textarea 
              className="w-full min-h-[200px] bg-transparent font-medium leading-relaxed outline-none resize-none disabled:cursor-not-allowed custom-scrollbar"
              value={profile.bio}
              onChange={e => setProfile({...profile, bio: e.target.value})}
              placeholder="Tell your patients about your methodology and background..."
              disabled={!canEdit}
            />
         </div>

         <div className="flex items-center justify-between p-8 bg-surface-900 rounded-[2.5rem] text-white shadow-2xl shadow-surface-900/20">
            <div className="flex items-center gap-4">
               {canEdit ? (
                 <div className="p-3 bg-green-500/20 text-green-400 rounded-2xl">
                    <Save size={24} />
                 </div>
               ) : (
                 <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl">
                    <AlertCircle size={24} />
                 </div>
               )}
               <div>
                  <p className="font-bold">{canEdit ? 'Synchronize All Changes' : 'Write Access Denied'}</p>
                  <p className="text-xs text-white/50">{canEdit ? 'Your profile updates are pushed instantly to all patients.' : 'Registry state is currently locked by central administration.'}</p>
               </div>
            </div>
            {canEdit && (
              <button 
                type="submit"
                disabled={isSaving}
                className="px-10 py-4 bg-white text-black rounded-2xl font-black uppercase text-sm hover:bg-brand-primary hover:text-white transition-all transform active:scale-95 disabled:opacity-50"
              >
                {isSaving ? 'Synching...' : 'Commit Updates'}
              </button>
            )}
         </div>
      </form>
    </div>
  );
}
