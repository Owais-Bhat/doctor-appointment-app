"use client";

import React, { useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';

export function RealtimeStatusProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const supabase = createClient();

    // Subscribe to appointment status changes
    const channel = supabase
      .channel('appointment-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'appointments',
          filter: `patient_id=eq.${user.uid}`,
        },
        (payload) => {
          const { new: newRecord, old: oldRecord } = payload;

          if (newRecord.status !== oldRecord.status) {
            const statusMessages: Record<string, string> = {
              'confirmed': 'Your appointment has been confirmed!',
              'in_progress': 'The doctor is ready for you! Please enter the consultation room.',
              'completed': 'Your consultation is now complete.',
              'cancelled': 'Your appointment has been cancelled.'
            };

            const message = statusMessages[newRecord.status] || `Your appointment status changed to ${newRecord.status}.`;
            toast.success(message, {
              duration: 5000,
              position: 'top-right',
              icon: '🔔'
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return <>{children}</>;
}


