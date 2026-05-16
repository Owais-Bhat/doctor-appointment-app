"use client";

import React, { useState, useEffect } from 'react';
import { Search, User, UserX, ShieldCheck, MoreVertical, Filter } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    async function fetchUsers() {
      setIsLoading(true);
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        setUsers(data || []);
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const toggleUserStatus = async (id: string, currentStatus: boolean) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: !currentStatus } : u));
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update user status");
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (isLoading) return <div className="p-6 text-gray-500">Loading user directory...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-500">Control access and manage all platform profiles</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-3 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search users..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-100 border border-surface-300 outline-none focus:ring-2 focus:ring-brand-primary text-sm"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="p-2 rounded-xl bg-surface-100 border border-surface-300 outline-none text-sm font-medium"
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="patient">Patients</option>
            <option value="doctor">Doctors</option>
            <option value="super_admin">Admins</option>
          </select>
        </div>
      </div>

      <div className="bg-surface-100 rounded-3xl border border-surface-300 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-200 text-gray-500 font-bold uppercase text-[10px]">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Joined</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-300">
            {filteredUsers.map(u => (
              <tr key={u.id} className="hover:bg-brand-primary/5 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface-200 flex items-center justify-center font-bold text-xs">
                      {u.full_name?.[0]}
                    </div>
                    <div>
                      <p className="font-semibold">{u.full_name}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                    u.role === 'super_admin' ? "bg-purple-100 text-purple-600" :
                    u.role === 'doctor' ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
                  )}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      u.is_active ? "bg-green-500" : "bg-red-500"
                    )} />
                    <span className="text-xs font-medium">{u.is_active ? 'Active' : 'Disabled'}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-500 text-xs">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => toggleUserStatus(u.id, u.is_active)}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      u.is_active ? "text-red-500 hover:bg-red-50" : "text-green-500 hover:bg-green-50"
                    )}
                  >
                    {u.is_active ? <UserX size={18} /> : <ShieldCheck size={18} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <div className="p-12 text-center text-gray-400">
            No users found matching your filters.
          </div>
        )}
      </div>
    </div>
  );
}
