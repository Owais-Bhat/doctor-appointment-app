import { api } from './api';

export type NextStatus = 'confirmed' | 'cancelled' | 'completed' | 'no_show';

/** Same rules as the server's ALLOWED_TRANSITIONS; the server stays the judge. */
export const NEXT_STATUS: Record<string, NextStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled', 'no_show'],
};

export const setVisitStatus = (id: string, status: NextStatus) => api(`/api/doctor/appointments/${id}`, { method: 'PATCH', body: { status } });

export const saveVisitNotes = (id: string, notes: string) => api(`/api/doctor/appointments/${id}`, { method: 'PATCH', body: { notes } });

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
export const SHORT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export const rupees = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
