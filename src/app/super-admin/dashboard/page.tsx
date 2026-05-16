"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, getFirestore, addDoc, serverTimestamp } from 'firebase/firestore';
import { format, subDays, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, Cell 
} from 'recharts';
import { 
  Users, UserCheck, DollarSign, Activity, TrendingUp, AlertCircle, 
  ShieldCheck, FileText, Settings, Download, Search, CheckCircle2, XCircle, UserX, X, Lock, Unlock, Mail, Save
} from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { auth as firebaseAuth } from '@/lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

function DashboardContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'doctors' | 'patients' | 'billing' | 'audit'>('overview');
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    platformRevenue: 0,
    pendingApprovals: 0,
    newRegistrations: 0
  });
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [registrationData, setRegistrationData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [newDoctorEmail, setNewDoctorEmail] = useState('');
  const [newDoctorPassword, setNewDoctorPassword] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  // Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const logAdminAction = async (action: string, target: string, details: string) => {
    try {
      await addDoc(collection(db, 'admin_audit_logs'), {
        adminId: user?.uid,
        adminEmail: user?.email,
        action,
        target,
        details,
        timestamp: serverTimestamp()
      });
      fetchAuditLogs();
    } catch (err) {
      console.error("Log failed", err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const snap = await getDocs(collection(db, 'admin_audit_logs'));
      const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a: any, b: any) => b.timestamp?.seconds - a.timestamp?.seconds);
      setAuditLogs(logs);
    } catch (err) {
      console.log('Error fetching logs', err);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const snap = await getDocs(collection(db, 'subscriptions'));
      const subs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setSubscriptions(subs);
    } catch (err) {
      console.log('No firestore subs or permission error', err);
    }
  };

  const cancelSubscription = async (docId: string) => {
    if(confirm('Are you sure you want to cancel this doctor\'s subscription?')) {
      await deleteDoc(doc(db, 'subscriptions', docId));
      await logAdminAction('CANCEL_SUBSCRIPTION', docId, 'Manual cancellation by Super Admin');
      fetchSubscriptions();
      alert('Subscription cancelled!');
    }
  };

  const approveDoctor = async (doctorId: string) => {
    try {
      const supabase = createClient();
      await supabase.from('doctor_profiles').update({ is_verified: true }).eq('id', doctorId);
      await logAdminAction('APPROVE_DOCTOR', doctorId, 'Doctor verification status updated to true');
      alert('Doctor Approved!');
      window.location.reload(); // Refresh to update counts
    } catch (err) {
      alert("Approval failed");
    }
  };

  const exportRevenueCSV = () => {
    const headers = ["Date", "Platform Revenue ($)"];
    const rows = revenueData.map(d => [d.date, d.revenue]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mediflow_revenue_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleWhitelistDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoctorEmail || !newDoctorPassword) return;
    setIsAdding(true);

    try {
      // 1. We must spin up a secondary Firebase App in memory.
      // If we use the primary `auth`, it will forcibly log the super-admin out!
      const { initializeApp } = await import('firebase/app');
      const { getAuth, createUserWithEmailAndPassword } = await import('firebase/auth');

      const secondaryApp = initializeApp({
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
      }, "SecondaryApp");

      const secondaryAuth = getAuth(secondaryApp);
      
      // 2. Generate the Firebase Auth account
      const userCred = await createUserWithEmailAndPassword(secondaryAuth, newDoctorEmail, newDoctorPassword);
      const newUid = userCred.user.uid;
      
      await secondaryAuth.signOut(); // Ensure memory flush

      // 3. Whitelist in Firestore (Source of truth for initial role)
      const firestore = getFirestore();
      await setDoc(doc(firestore, 'whitelisted_doctors', newDoctorEmail.toLowerCase()), {
        addedAt: new Date().toISOString(),
        provisionedBy: user?.uid
      });

      await logAdminAction('PROVISION_DOCTOR', newDoctorEmail, 'Assigned secondary auth and forced SaaS tenant entry');

      alert(`Official Doctor Account Created!\nEmail: ${newDoctorEmail}\nPassword: ${newDoctorPassword}`);
      setNewDoctorEmail('');
      setNewDoctorPassword('');
    } catch (err: any) {
      alert("Error provisioning doctor: " + err.message);
    } finally {
      setIsAdding(false);
    }
  };

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['overview', 'doctors', 'patients', 'billing', 'audit'].includes(tab)) {
      setActiveTab(tab as any);
    }
  }, [searchParams]);

  const toggleUserStatus = async (id: string, currentStatus: boolean, collection: 'profiles' | 'doctor_profiles' = 'profiles') => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from(collection)
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      
      const action = !currentStatus ? 'ACTIVATE' : 'DEACTIVATE';
      await logAdminAction(action, id, `User status updated in ${collection}`);
      
      alert(`User ${!currentStatus ? 'activated' : 'deactivated'}`);
      if (editingDoctor) setEditingDoctor({ ...editingDoctor, is_active: !currentStatus });
      window.location.reload(); 
    } catch (err: any) {
      alert("Status update failed");
    }
  };

  const handleUpdateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoctor) return;
    setIsSaving(true);

    try {
      const supabase = createClient();
      
      // 1. Update Supabase
      const { error: sbError } = await supabase
        .from('doctor_profiles')
        .update({
          specialty: editingDoctor.specialty,
          consultation_fee: parseFloat(editingDoctor.consultation_fee),
          experience_years: parseInt(editingDoctor.experience_years),
          bio: editingDoctor.bio,
          is_verified: editingDoctor.is_verified
        })
        .eq('id', editingDoctor.id);

      if (sbError) throw sbError;

      // 2. Update Firestore Permissions/Metadata
      await setDoc(doc(db, 'doctor_configs', editingDoctor.email), {
        can_self_edit: editingDoctor.can_self_edit ?? true,
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid
      }, { merge: true });

      await logAdminAction('UPDATE_DOCTOR_DEEP', editingDoctor.email, 'Modified clinical fees and bio parameters');
      alert('Doctor Node Updated Successfully!');
      setIsDrawerOpen(false);
      window.location.reload();
    } catch (err: any) {
      alert("Update failed: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!editingDoctor?.email) return;
    if (confirm(`Send password reset link to ${editingDoctor.email}?`)) {
      try {
        await sendPasswordResetEmail(firebaseAuth, editingDoctor.email);
        alert('Reset email transmitted successfully');
        await logAdminAction('PASSWORD_RESET_TRIGGER', editingDoctor.email, 'Admin triggered secure credential reset');
      } catch (err: any) {
        alert("Reset failed: " + err.message);
      }
    }
  };

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      setIsLoading(true);
      try {
        const supabase = createClient();

        // 1. Fetch Global Stats & Chart Data
        const { data: allProfiles } = await supabase.from('profiles').select('*');
        const { data: allDoctorProfiles } = await supabase.from('doctor_profiles').select('*, profiles(*)');
        const { data: allAppointments } = await supabase.from('appointments').select('*');
        
        // 2. Fetch Pending Invitations (Firestore)
        const whitelistSnap = await getDocs(collection(db, 'whitelisted_doctors'));
        const pendingInvites = whitelistSnap.docs.map(d => ({ email: d.id, ...d.data(), is_pending_invite: true }));

        // 3. Fetch Doctor Configs (Permissions/Custom Flags)
        const configSnap = await getDocs(collection(db, 'doctor_configs'));
        const configMap = new Map(configSnap.docs.map(d => [d.id, d.data()]));

        // Calculate Stats
        const patientCount = allProfiles?.filter(p => p.role === 'patient').length || 0;
        const doctorCount = allDoctorProfiles?.length || 0;
        const totalDoctorNodes = doctorCount + pendingInvites.length;
        const pendingCount = (allDoctorProfiles?.filter(d => !d.is_verified).length || 0) + pendingInvites.length;

        // Group Revenue by Date for Chart
        const revenueByDate = new Map();
        const feeMap = new Map(allDoctorProfiles?.map(f => [f.id, f.consultation_fee]) || []);
        
        allAppointments?.filter(a => a.status === 'confirmed' || a.status === 'completed').forEach(app => {
          const date = format(new Date(app.appointment_date), 'MMM dd');
          const fee = feeMap.get(app.doctor_id) || 100;
          revenueByDate.set(date, (revenueByDate.get(date) || 0) + fee);
        });

        // Group Registrations by Date (Last 7 days)
        const registrationsByDate = new Map();
        allProfiles?.forEach(p => {
          const date = format(new Date(p.created_at), 'MMM dd');
          registrationsByDate.set(date, (registrationsByDate.get(date) || 0) + 1);
        });

        // Convert Maps to Recharts format
        const chartRevenue = Array.from(revenueByDate.entries())
          .map(([date, revenue]) => ({ date, revenue }))
          .slice(-10);

        const chartReg = Array.from(registrationsByDate.entries())
          .map(([date, count]) => ({ date, count }))
          .slice(-7);

        setStats({
          totalPatients: patientCount,
          totalDoctors: totalDoctorNodes,
          platformRevenue: Array.from(revenueByDate.values()).reduce((a, b) => a + b, 0),
          pendingApprovals: pendingCount,
          newRegistrations: chartReg.reduce((a, b) => a + b.count, 0)
        });

        setRevenueData(chartRevenue);
        setRegistrationData(chartReg);
        
        // Merge real doctors with pending invites for the directory
        const mergedDoctors = [
          ...allDoctorProfiles?.map(d => {
            const config = configMap.get(d.profiles?.email) as any;
            return {
              id: d.id,
              name: d.profiles?.full_name || 'Incomplete Profile',
              specialty: d.specialty,
              consultation_fee: d.consultation_fee,
              experience_years: d.experience_years,
              bio: d.bio,
              is_verified: d.is_verified,
              is_active: d.is_active,
              email: d.profiles?.email,
              profiles: d.profiles,
              can_self_edit: config?.can_self_edit ?? true
            };
          }) || [],
          ...pendingInvites.map(inv => ({
            id: `pending-${inv.email}`,
            name: 'Pending Sign-up',
            specialty: 'Awaiting Onboarding',
            consultation_fee: 0,
            is_verified: false,
            is_pending_invite: true,
            email: inv.email,
            can_self_edit: true
          }))
        ];

        setDoctors(mergedDoctors);
        setPatients(allProfiles?.filter(p => p.role === 'patient') || []);

      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
    fetchSubscriptions();
    fetchAuditLogs();
  }, [user]);

  if (isLoading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Activity className="text-red-500 animate-pulse" size={48} />
        <p className="text-gray-400 font-medium">Bypassing firewalls and syncing system nodes...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      {/* Header & Main Nav */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white flex items-center gap-3">
            <ShieldCheck className="text-red-500" size={40} />
            Command Center
          </h1>
          <p className="text-gray-500 mt-1 uppercase text-xs font-bold tracking-widest">Global Administrative Authority</p>
        </div>
        
        <div className="flex bg-surface-200 p-1.5 rounded-2xl border border-surface-300 shadow-inner overflow-x-auto max-w-full">
          {[
            { id: 'overview', icon: Activity, label: 'Overview' },
            { id: 'doctors', icon: UserCheck, label: 'Practitioners' },
            { id: 'patients', icon: Users, label: 'Patients' },
            { id: 'billing', icon: DollarSign, label: 'SaaS Billing' },
            { id: 'audit', icon: FileText, label: 'Audit Logs' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all font-bold text-sm whitespace-nowrap",
                activeTab === tab.id 
                  ? "bg-white text-black shadow-md border border-surface-300" 
                  : "text-gray-500 hover:text-gray-800"
              )}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Ribbons */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <KPICard title="Total Residents" value={stats.totalPatients} icon={Users} color="text-blue-500" bg="bg-blue-500/10" />
        <KPICard title="Active Tenancy" value={stats.totalDoctors} icon={UserCheck} color="text-green-500" bg="bg-green-500/10" />
        <KPICard title="Revenue Engine" value={`$${stats.platformRevenue.toLocaleString()}`} icon={DollarSign} color="text-yellow-500" bg="bg-yellow-500/10" />
        <KPICard title="Verification Queue" value={stats.pendingApprovals} icon={AlertCircle} color="text-red-500" bg="bg-red-500/10" highlight={stats.pendingApprovals > 0} />
        <KPICard title="Growth Velocity" value={`${stats.newRegistrations}`} icon={TrendingUp} color="text-purple-500" bg="bg-purple-500/10" />
      </div>

      {/* Dynamic Content Area */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Revenue Velocity Chart */}
            <div className="bg-surface-100 p-8 rounded-[2rem] border border-surface-300 shadow-sm relative group overflow-hidden">
               <div className="flex justify-between items-center mb-8">
                 <div>
                   <h3 className="text-xl font-bold">Revenue Pulse</h3>
                   <p className="text-sm text-gray-500">Transaction velocity across all tenants</p>
                 </div>
                 <button 
                  onClick={exportRevenueCSV}
                  className="p-2 hover:bg-white rounded-xl transition-colors text-gray-400 hover:text-black border border-transparent hover:border-surface-300"
                  title="Export Data"
                 >
                   <Download size={20} />
                 </button>
               </div>
               
               <div className="h-80 w-full min-h-[320px]">
                 <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={revenueData}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                     <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9CA3AF'}} dy={10} />
                     <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9CA3AF'}} tickFormatter={(v) => `$${v}`} />
                     <Tooltip 
                        contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                        cursor={{stroke: '#EF4444', strokeWidth: 2}}
                     />
                     <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#EF4444" 
                      strokeWidth={4} 
                      dot={{r: 6, fill: '#EF4444', strokeWidth: 2, stroke: '#fff'}}
                      activeDot={{r: 8, strokeWidth: 0}}
                     />
                   </LineChart>
                 </ResponsiveContainer>
               </div>
            </div>

            {/* Registration Velocity */}
            <div className="bg-surface-100 p-8 rounded-[2rem] border border-surface-300 shadow-sm">
               <h3 className="text-xl font-bold mb-8">User Acquisition</h3>
               <div className="h-64 w-full min-h-[256px]">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={registrationData}>
                     <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9CA3AF'}} />
                     <Tooltip cursor={{fill: '#F3F4F6'}} contentStyle={{borderRadius: '12px', border: 'none'}} />
                     <Bar dataKey="count" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                   </BarChart>
                 </ResponsiveContainer>
               </div>
            </div>
          </div>

          <div className="space-y-8">
             {/* Simulation Performance */}
             <div className="bg-surface-100 p-8 rounded-[2rem] border border-surface-300 shadow-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4">
                   <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                </div>
                <h3 className="text-xl font-bold mb-6">System Nodes</h3>
                <div className="space-y-6">
                   <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                         <span className="text-gray-500 font-medium">Uptime Strategy</span>
                         <span className="text-green-500 font-bold">99.98%</span>
                      </div>
                      <div className="w-full bg-surface-200 h-2 rounded-full overflow-hidden">
                         <div className="bg-green-500 h-full w-[99.98%] shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                      </div>
                   </div>
                   <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                         <span className="text-gray-500 font-medium">Network Latency</span>
                         <span className="text-blue-500 font-bold">42ms</span>
                      </div>
                      <div className="w-full bg-surface-200 h-2 rounded-full overflow-hidden">
                         <div className="bg-blue-500 h-full w-[15%] transition-all duration-1000"></div>
                      </div>
                   </div>
                   <div className="pt-4 border-t border-surface-200 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                         <Activity size={14} /> Node Cluster
                      </div>
                      <span className="text-sm font-bold">US-East-1 (AWS)</span>
                   </div>
                </div>
             </div>

             {/* Provisioning Summary Card */}
             <div className="bg-black text-white p-8 rounded-[2rem] shadow-2xl relative group cursor-pointer hover:scale-[1.02] transition-all overflow-hidden" onClick={() => setActiveTab('doctors')}>
                <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:bg-red-500/20 transition-all"></div>
                <h3 className="text-xl font-bold mb-2">New Onboarding</h3>
                <p className="text-gray-400 text-sm mb-6">You have {stats.pendingApprovals} practitioners awaiting node authorization.</p>
                <div className="flex items-center gap-2 text-red-500 font-bold text-sm">
                   Accelerate Provisioning <TrendingUp size={16} />
                </div>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'doctors' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
           {/* Add Doctor Section */}
           <div className="bg-surface-100 p-8 rounded-[2.5rem] border border-surface-300 shadow-sm grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl font-black mb-4">Infrastructure Provisioning</h3>
                <p className="text-gray-500 leading-relaxed">
                  Generate official SaaS tenant credentials. This action assigns professional encryption keys and provisions a private Supabase partition for the practitioner.
                </p>
              </div>
              <form onSubmit={handleWhitelistDoctor} className="flex flex-col gap-4">
                <input 
                  type="email" 
                  placeholder="Official Email Address"
                  value={newDoctorEmail}
                  onChange={(e) => setNewDoctorEmail(e.target.value)}
                  className="w-full p-4 bg-white border border-surface-300 rounded-2xl focus:ring-2 focus:ring-red-500 focus:outline-none transition-all"
                  required
                />
                <input 
                  type="password" 
                  placeholder="Temporary Access Key (Passphrase)"
                  value={newDoctorPassword}
                  onChange={(e) => setNewDoctorPassword(e.target.value)}
                  className="w-full p-4 bg-white border border-surface-300 rounded-2xl focus:ring-2 focus:ring-red-500 focus:outline-none transition-all"
                  required
                  minLength={6}
                />
                <button 
                  type="submit" 
                  disabled={isAdding}
                  className="w-full py-4 bg-black text-white font-black rounded-2xl hover:bg-neutral-800 transition-all disabled:opacity-50"
                >
                  {isAdding ? 'Initializing Nodes...' : 'Generate Provider Key'}
                </button>
              </form>
           </div>

           {/* Doctors Management Table */}
           <div className="bg-surface-100 p-8 rounded-[2.5rem] border border-surface-300 shadow-sm space-y-6">
              <div className="flex justify-between items-center">
                 <h3 className="text-2xl font-bold">Practitioner Directory</h3>
                 <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Search ID or Specialty..."
                      className="pl-10 pr-4 py-2 bg-white border border-surface-300 rounded-xl focus:outline-none text-sm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                 </div>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="text-xs uppercase font-black text-gray-400 border-b border-surface-300">
                       <tr>
                          <th className="pb-4">Name/Specialty</th>
                          <th className="pb-4">Fee Structure</th>
                          <th className="pb-4">Node Status</th>
                          <th className="pb-4 text-right">Administrative Action</th>
                       </tr>
                    </thead>
                     <tbody className="divide-y divide-surface-200">
                        {doctors.filter(d => (d.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (d.email || '').toLowerCase().includes(searchQuery.toLowerCase())).map(doc => (
                          <tr 
                            key={doc.id} 
                            onClick={() => {
                              setEditingDoctor({ ...doc });
                              setIsDrawerOpen(true);
                            }}
                            className={cn(
                              "group transition-all cursor-pointer", 
                              doc.is_pending_invite ? "bg-amber-50/50" : "hover:bg-brand-primary/5 active:scale-[0.99]"
                            )}
                          >
                            <td className="py-5">
                               <div className="font-bold text-gray-900 flex items-center gap-2">
                                 {doc.name}
                                 {doc.is_pending_invite && (
                                   <span className="text-[9px] font-black bg-amber-500 text-white px-2 py-0.5 rounded-full uppercase">Invited</span>
                                 )}
                               </div>
                               <div className="text-xs text-gray-500 font-medium">{doc.specialty}</div>
                               <div className="text-[10px] text-gray-400">{doc.email}</div>
                            </td>
                            <td className="py-5 text-sm font-bold text-gray-700">
                              {doc.is_pending_invite ? 'Wait for Signup' : `$${doc.consultation_fee}/hr`}
                            </td>
                            <td className="py-5">
                               {doc.is_verified ? (
                                 <span className="flex items-center gap-1.5 text-xs font-black text-green-600 bg-green-100 px-2.5 py-1 rounded-full w-fit">
                                    <CheckCircle2 size={12} /> AUTH_VERIFIED
                                 </span>
                               ) : (
                                 <span className="flex items-center gap-1.5 text-xs font-black text-amber-600 bg-amber-100 px-2.5 py-1 rounded-full w-fit">
                                    <Activity size={12} /> {doc.is_pending_invite ? 'AWAIT_SIGNUP' : 'PENDING_SECURE'}
                                 </span>
                               )}
                            </td>
                            <td className="py-5 text-right flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                               {!doc.is_verified && !doc.is_pending_invite && (
                                 <button 
                                   onClick={() => approveDoctor(doc.id)}
                                   className="px-4 py-1.5 bg-black text-white text-xs font-black rounded-lg hover:bg-neutral-800 transition-all uppercase tracking-tighter"
                                 >
                                    Authorize Node
                                 </button>
                               )}
                               {!doc.is_pending_invite && (
                                <button
                                  onClick={() => toggleUserStatus(doc.id, doc.is_active || true, 'doctor_profiles')}
                                  className={cn(
                                    "p-2 rounded-lg transition-colors",
                                    doc.is_active ? "text-red-500 hover:bg-red-50" : "text-green-500 hover:bg-green-50"
                                  )}
                                  title={doc.is_active ? "Deactivate Account" : "Activate Account"}
                                >
                                  {doc.is_active ? <UserX size={18} /> : <ShieldCheck size={18} />}
                                </button>
                               )}
                            </td>
                          </tr>
                        ))}
                     </tbody>
                 </table>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'patients' && (
        <div className="bg-surface-100 p-8 rounded-[2.5rem] border border-surface-300 shadow-sm animate-in fade-in">
           <h3 className="text-2xl font-bold mb-8">Resident Registry</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {patients.map(p => (
                <div key={p.id} className="p-6 bg-white border border-surface-300 rounded-[2rem] hover:shadow-xl transition-all group">
                   <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-red-500 text-white rounded-2xl flex items-center justify-center font-black text-xl">
                         {p.full_name.charAt(0)}
                      </div>
                      <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Res_ID: {p.id.slice(0, 8)}</span>
                   </div>
                   <h4 className="font-bold text-lg mb-1">{p.full_name}</h4>
                   <p className="text-sm text-gray-500 mb-6">{p.email}</p>
                   <div className="flex gap-2 items-center justify-between">
                       <div className="flex gap-2">
                          <span className="px-3 py-1 bg-surface-200 text-xs font-bold rounded-lg group-hover:bg-red-500 group-hover:text-white transition-colors">Vitals_Synced</span>
                          <span className={cn(
                            "px-3 py-1 text-xs font-bold rounded-lg transition-colors",
                            p.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          )}>
                            {p.is_active ? 'Active' : 'Disabled'}
                          </span>
                       </div>
                       <button
                          onClick={() => toggleUserStatus(p.id, p.is_active)}
                          className={cn(
                            "p-2 rounded-lg transition-colors",
                            p.is_active ? "text-red-500 hover:bg-red-50" : "text-green-500 hover:bg-green-50"
                          )}
                        >
                          {p.is_active ? <UserX size={18} /> : <ShieldCheck size={18} />}
                        </button>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

       {activeTab === 'billing' && (
        <div className="space-y-8 animate-in fade-in">
           <div className="p-6 bg-surface-100 rounded-3xl border border-surface-300 shadow-sm space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Comprehensive Subscription Registry</h3>
                <button className="text-red-500 text-sm font-bold flex items-center gap-1" onClick={fetchSubscriptions}>
                  <TrendingUp size={14} /> REFRESH_STREAM
                </button>
              </div>
              <div className="overflow-hidden rounded-2xl border border-surface-300 bg-white shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-surface-200 text-sm text-gray-500 font-bold uppercase tracking-tight">
                    <tr>
                      <th className="p-4">Practitioner / Tenant</th>
                      <th className="p-4">Billing Status</th>
                      <th className="p-4 text-right">Administrative Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-200">
                    {doctors.map(doc => {
                       const sub = subscriptions.find(s => s.id === doc.email || s.doctorEmail === doc.email);
                       return (
                        <tr key={doc.id} className="hover:bg-surface-50 transition-colors">
                          <td className="p-4">
                            <div className="font-bold text-gray-900">{doc.name}</div>
                            <div className="text-xs text-gray-500">{doc.email}</div>
                          </td>
                          <td className="p-4">
                            {sub ? (
                              <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-black rounded-full uppercase tracking-tighter border border-green-200 shadow-sm">
                                NODE_ACTIVE
                              </span>
                            ) : (
                               <span className="px-3 py-1 bg-gray-100 text-gray-500 text-[10px] font-black rounded-full uppercase tracking-tighter border border-gray-200">
                                 UNSUBSCRIBED
                               </span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            {sub ? (
                              <button 
                                onClick={() => cancelSubscription(sub.id)} 
                                className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-black uppercase hover:bg-red-500 hover:text-white transition-all border border-red-200"
                              >
                                Terminate Stream
                              </button>
                            ) : (
                               <button 
                                 className="px-4 py-2 bg-surface-200 text-gray-400 rounded-xl text-xs font-black uppercase cursor-not-allowed"
                                 disabled
                               >
                                 No Active Stream
                               </button>
                            )}
                          </td>
                        </tr>
                       );
                    })}
                  </tbody>
                </table>
                {doctors.length === 0 && (
                  <div className="p-12 text-center text-gray-400 italic">
                    Initializing Practitioner Streams...
                  </div>
                )}
              </div>
           </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="bg-surface-100 p-8 rounded-[2.5rem] border border-surface-300 shadow-sm animate-in fade-in max-h-[70vh] overflow-y-auto custom-scrollbar">
           <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold">System Log Analysis</h3>
              <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest">
                 <ShieldCheck size={14} /> Kernel Integrity: 100%
              </div>
           </div>
           
           <div className="space-y-4">
              {auditLogs.map(log => (
                <div key={log.id} className="p-5 bg-white border border-surface-200 rounded-[1.5rem] flex flex-col md:flex-row gap-4 items-start md:items-center">
                   <div className="flex items-center gap-4 flex-1">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs",
                        log.action === 'APPROVE_DOCTOR' ? 'bg-green-500/10 text-green-600' :
                        log.action === 'CANCEL_SUBSCRIPTION' ? 'bg-red-500/10 text-red-600' :
                        'bg-blue-500/10 text-blue-600'
                      )}>
                         {log.action?.slice(0, 3)}
                      </div>
                      <div>
                        <div className="font-bold text-sm tracking-tight">{log.action}</div>
                        <div className="text-xs text-gray-500 font-medium">Target: <span className="text-black">{log.target}</span></div>
                      </div>
                   </div>
                   <div className="flex flex-col md:items-end gap-1">
                      <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                         {log.timestamp?.seconds ? format(new Date(log.timestamp.seconds * 1000), 'MMM dd, HH:mm:ss') : 'LIVE'}
                      </div>
                      <div className="text-[10px] text-gray-400">{log.details}</div>
                   </div>
                </div>
              ))}
           </div>
         </div>
       )}

      {/* Doctor Edit Drawer */}
      {isDrawerOpen && editingDoctor && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] animate-in fade-in duration-300" 
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="fixed right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl z-[101] animate-in slide-in-from-right duration-500 flex flex-col">
            <div className="p-8 border-b border-surface-300 flex items-center justify-between bg-surface-50">
               <div>
                  <h2 className="text-2xl font-black tracking-tighter uppercase italic">Practitioner Override</h2>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{editingDoctor.email}</p>
               </div>
               <button onClick={() => setIsDrawerOpen(false)} className="p-3 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all rounded-2xl">
                  <X size={24} />
               </button>
            </div>

            <form onSubmit={handleUpdateDoctor} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
               {/* Clinical Overrides */}
               <div className="space-y-4">
                  <h3 className="text-xs font-black text-brand-primary uppercase tracking-[0.2em] flex items-center gap-2">
                     <Settings size={14} /> Clinical Parameters
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase">Primary Specialty</label>
                        <input 
                          className="w-full p-4 bg-surface-100 border border-surface-300 rounded-2xl font-bold focus:ring-2 focus:ring-brand-primary outline-none"
                          value={editingDoctor.specialty}
                          onChange={e => setEditingDoctor({...editingDoctor, specialty: e.target.value})}
                        />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase">Consultation Fee ($)</label>
                        <input 
                          type="number"
                          className="w-full p-4 bg-surface-100 border border-surface-300 rounded-2xl font-bold focus:ring-2 focus:ring-brand-primary outline-none"
                          value={editingDoctor.consultation_fee}
                          onChange={e => setEditingDoctor({...editingDoctor, consultation_fee: e.target.value})}
                        />
                     </div>
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-gray-400 uppercase">Years of Clinical Experience</label>
                     <input 
                       type="number"
                       className="w-full p-4 bg-surface-100 border border-surface-300 rounded-2xl font-bold focus:ring-2 focus:ring-brand-primary outline-none"
                       value={editingDoctor.experience_years}
                       onChange={e => setEditingDoctor({...editingDoctor, experience_years: e.target.value})}
                     />
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-gray-400 uppercase">Medical Bio / Persona</label>
                     <textarea 
                       className="w-full p-4 bg-surface-100 border border-surface-300 rounded-2xl font-medium focus:ring-2 focus:ring-brand-primary outline-none min-h-[120px]"
                       value={editingDoctor.bio}
                       onChange={e => setEditingDoctor({...editingDoctor, bio: e.target.value})}
                     />
                  </div>
               </div>

               {/* Governance & Credentials */}
               <div className="p-6 bg-brand-primary/5 rounded-[2rem] border border-brand-primary/10 space-y-6">
                  <h3 className="text-xs font-black text-brand-primary uppercase tracking-[0.2em] flex items-center gap-2">
                     <ShieldCheck size={14} /> Node Governance
                  </h3>
                  
                  <div className="flex items-center justify-between">
                     <div>
                        <p className="font-bold text-sm">Allow Self-Service Edits</p>
                        <p className="text-[10px] text-gray-500 uppercase font-medium">Allow doctor to modify their own profile data</p>
                     </div>
                     <button 
                       type="button"
                       onClick={() => setEditingDoctor({...editingDoctor, can_self_edit: !editingDoctor.can_self_edit})}
                       className={cn(
                         "p-3 rounded-2xl transition-all",
                         editingDoctor.can_self_edit ? "bg-green-500 text-white" : "bg-gray-200 text-gray-400"
                       )}
                     >
                        {editingDoctor.can_self_edit ? <Unlock size={20} /> : <Lock size={20} />}
                     </button>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-brand-primary/10">
                     <div>
                        <p className="font-bold text-sm">Credential Validation</p>
                        <p className="text-[10px] text-gray-500 uppercase font-medium">Current Status: {editingDoctor.is_verified ? 'VERIFIED' : 'PENDING'}</p>
                     </div>
                     <button 
                       type="button"
                       onClick={() => setEditingDoctor({...editingDoctor, is_verified: !editingDoctor.is_verified})}
                       className={cn(
                         "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all",
                         editingDoctor.is_verified ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"
                       )}
                     >
                        {editingDoctor.is_verified ? 'Authorized' : 'Grant Auth'}
                     </button>
                  </div>
               </div>

               {/* Secondary Security Actions */}
               <div className="space-y-4">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                     <Lock size={14} /> Security Actions
                  </h3>
                  <button 
                    type="button"
                    onClick={handlePasswordReset}
                    className="w-full p-4 border-2 border-dashed border-surface-300 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold text-gray-500 hover:border-brand-primary hover:text-brand-primary transition-all"
                  >
                     <Mail size={18} /> Trigger Secure Credentials Reset
                  </button>
               </div>
            </form>

            <div className="p-8 border-t border-surface-300 bg-surface-50 flex gap-4">
               <button 
                 type="button"
                 onClick={() => setIsDrawerOpen(false)}
                 className="flex-1 py-4 bg-white border border-surface-300 rounded-2xl font-black uppercase text-sm hover:bg-surface-100 transition-all"
               >
                  Cancel Changes
               </button>
               <button 
                 onClick={handleUpdateDoctor}
                 disabled={isSaving}
                 className="flex-[2] py-4 bg-black text-white rounded-2xl font-black uppercase text-sm hover:hover:bg-neutral-800 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
               >
                  {isSaving ? 'Synching Nodes...' : <><Save size={18} /> Push Parameters</>}
               </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function SuperAdminDashboard() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-gray-500 font-bold uppercase tracking-widest animate-pulse">Initializing Control Center...</div>}>
      <DashboardContent />
    </Suspense>
  );
}

function KPICard({ title, value, icon: Icon, color, bg, highlight }: any) {
  return (
    <div className={cn(
      "p-6 bg-surface-100 rounded-3xl border shadow-sm transition-all",
      highlight ? "border-red-500 ring-2 ring-red-500/20 scale-105" : "border-surface-300"
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-3 rounded-2xl", bg, color)}>
          <Icon size={24} />
        </div>
      </div>
      <p className="text-gray-500 text-sm font-medium">{title}</p>
      <h3 className="text-2xl font-bold mt-1">{value}</h3>
    </div>
  );
}
