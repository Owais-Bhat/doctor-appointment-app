"use client";

import React, { useState, useEffect } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase';

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchNotifications() {
      if (!user) return;
      setIsLoading(true);
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.uid)
          .order('created_at', { ascending: false });
        setNotifications(data || []);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchNotifications();
  }, [user]);

  const markAsRead = async (id: string) => {
    const supabase = createClient();
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    const supabase = createClient();
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user?.uid);
    setNotifications(notifications.map(n => ({ ...n, is_read: true })));
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Notifications</h1>
        <button
          onClick={markAllRead}
          className="text-sm font-semibold text-brand-primary hover:underline"
        >
          Mark all as read
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-gray-500">Loading notifications...</div>
      ) : notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map(n => (
            <div
              key={n.id}
              className={cn(
                "p-4 bg-surface-100 rounded-2xl border transition-all flex items-start gap-4",
                n.is_read ? "border-surface-300 opacity-70" : "border-brand-primary bg-brand-primary/5"
              )}
            >
              <div className="p-2 bg-surface-200 rounded-full text-brand-primary">
                <Bell size={18} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <p className="font-bold">{n.title}</p>
                  <span className="text-[10px] text-gray-400">{new Date(n.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{n.message}</p>
              </div>
              {!n.is_read && (
                <button
                  onClick={() => markAsRead(n.id)}
                  className="p-2 hover:bg-surface-200 rounded-lg text-gray-400 hover:text-brand-primary"
                >
                  <Check size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-surface-100 rounded-3xl border-2 border-dashed border-surface-300 text-gray-500">
          No notifications yet.
        </div>
      )}
    </div>
  );
}
