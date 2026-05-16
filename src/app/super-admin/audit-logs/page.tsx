"use client";

import React, { useState, useEffect } from 'react';
import { FileText, ShieldAlert, Clock, UserCheck, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { format } from 'date-fns';

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      setIsLoading(true);
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('audit_logs')
          .select('*, profiles(*)')
          .order('created_at', { ascending: false });
        setLogs(data || []);
      } catch (err) {
        console.error("Error fetching audit logs:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchLogs();
  }, []);

  if (isLoading) return <div className="p-6 text-gray-500">Retrieving system logs...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">System Audit Trail</h1>
          <p className="text-gray-500">Immutable record of all administrative actions</p>
        </div>
      </div>

      <div className="bg-surface-100 rounded-3xl border border-surface-300 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-200 text-gray-500 font-bold uppercase text-[10px]">
            <tr>
              <th className="px-6 py-4">Timestamp</th>
              <th className="px-6 py-4">Actor</th>
              <th className="px-6 py-4">Action</th>
              <th className="px-6 py-4">Target</th>
              <th className="px-6 py-4">Metadata</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-300">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-brand-primary/5 transition-colors">
                <td className="px-6 py-4 text-gray-500 text-xs">
                  {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm')}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-surface-200 flex items-center justify-center text-[10px] font-bold">
                      {log.profiles?.full_name?.[0] || 'A'}
                    </div>
                    <span className="font-medium">{log.profiles?.full_name || 'System'}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                    log.action.includes('approve') ? "bg-green-100 text-green-600" :
                    log.action.includes('reject') || log.action.includes('delete') ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                  )}>
                    {log.action}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold">{log.target_table}</span>
                    <span className="text-[10px] text-gray-400">{log.target_id}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <pre className="text-[10px] bg-surface-200 p-2 rounded-lg overflow-x-auto max-w-xs">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && (
          <div className="p-12 text-center text-gray-400">
            <div className="flex flex-col items-center gap-2">
              <FileText size={40} className="text-gray-300" />
              <p>No audit logs available.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
