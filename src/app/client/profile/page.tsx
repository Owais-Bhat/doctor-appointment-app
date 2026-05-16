"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase';
import { Heart, Scale, Ruler, Activity, User } from 'lucide-react';
import { HealthTimeline } from '@/components/shared/HealthTimeline';
import { toast } from 'react-hot-toast';

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;
      const supabase = createClient();

      // 1. Fetch Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.uid)
        .single();

      setProfile(profileData);
      setFormData(profileData);

      // 2. Fetch Appointments for Timeline
      const { data: appointments } = await supabase
        .from('appointments')
        .select('*, doctor_profiles(*)')
        .eq('patient_id', user.uid)
        .order('appointment_date', { ascending: false });

      if (appointments) {
        const events = appointments.map(app => ({
          id: app.id,
          date: app.appointment_date,
          type: 'visit' as const,
          title: `Consultation with Dr. ${app.doctor_profiles?.full_name || 'Specialist'}`,
          description: app.notes || 'Regular check-up and consultation.',
          status: app.status
        }));
        setTimelineEvents(events);
      }
    }
    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    const supabase = createClient();
    const { error } = await supabase.from('profiles').update(formData).eq('id', user?.uid);
    if (error) {
      toast.error("Failed to save profile");
    } else {
      setProfile(formData);
      setIsEditing(false);
      toast.success("Profile updated");
    }
  };

  if (!profile) return <div className="p-6 text-gray-500">Loading health profile...</div>;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Health Profile</h1>
        <button
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className="px-6 py-2 bg-brand-primary text-white rounded-full font-semibold hover:opacity-90 transition-all shadow-lg"
        >
          {isEditing ? 'Save Changes' : 'Edit Profile'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-8 bg-surface-100 rounded-3xl border border-surface-300 text-center shadow-sm">
            <div className="w-24 h-24 rounded-full bg-surface-200 mx-auto mb-4 overflow-hidden border-4 border-white shadow-md">
              {profile.avatar_url ? <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-xl">User</div>}
            </div>
            <h2 className="text-xl font-bold">{profile.full_name}</h2>
            <p className="text-gray-500 text-sm mb-4">{profile.email}</p>
            <div className="flex justify-center gap-2">
              <span className="px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-full text-xs font-bold">{profile.blood_type || 'Unknown'} Blood</span>
            </div>
          </div>

          <div className="p-8 bg-surface-100 rounded-3xl border border-surface-300 shadow-sm space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Activity size={20} /> Health Vitals
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <VitalCard icon={Heart} label="Heart Rate" value={profile.health_stats?.heartRate || '72'} unit="bpm" />
              <VitalCard icon={Scale} label="Weight" value={profile.health_stats?.weight || '70'} unit="kg" />
              <VitalCard icon={Ruler} label="Height" value={profile.health_stats?.height || '175'} unit="cm" />
              <VitalCard icon={Activity} label="Score" value={profile.health_stats?.score || '0'} unit="%" />
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          {/* Personal Info Section */}
          <div className="p-8 bg-surface-100 rounded-3xl border border-surface-300 shadow-sm space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <User size={20} /> Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase">Full Name</label>
                {isEditing ? (
                  <input
                    className="w-full p-3 rounded-xl bg-surface-200 outline-none focus:ring-2 focus:ring-brand-primary transition-all"
                    value={formData.full_name}
                    onChange={e => setFormData({...formData, full_name: e.target.value})}
                  />
                ) : <p className="font-medium p-1">{profile.full_name}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase">Phone</label>
                {isEditing ? (
                  <input
                    className="w-full p-3 rounded-xl bg-surface-200 outline-none focus:ring-2 focus:ring-brand-primary transition-all"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                ) : <p className="font-medium p-1">{profile.phone || 'Not provided'}</p>}
              </div>
            </div>
          </div>

          {/* Health Timeline */}
          <div className="p-8 bg-surface-100 rounded-3xl border border-surface-300 shadow-sm space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Calendar size={20} /> Medical Journey Timeline
            </h3>
            {timelineEvents.length > 0 ? (
              <HealthTimeline events={timelineEvents} />
            ) : (
              <div className="py-12 text-center text-gray-400 border-2 border-dashed border-surface-300 rounded-2xl">
                <p>No visit history available yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function VitalCard({ icon: Icon, label, value, unit }: any) {
  return (
    <div className="p-4 bg-surface-200 rounded-2xl border border-surface-300 text-center transition-all hover:bg-white group">
      <div className="flex justify-center mb-2 text-brand-primary group-hover:scale-110 transition-transform">
        <Icon size={20} />
      </div>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-xl font-bold">{value}{unit}</p>
    </div>
  );
}

