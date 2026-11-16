/** Shapes returned by the MedFlow web API (see src/app/api in the web app). */

export type Role = 'patient' | 'doctor' | 'super_admin';

export type Profile = { id: string; role: Role; full_name: string; email: string };

export type Doctor = {
  id: string;
  profile_id: string | null;
  specialty: string;
  bio: string | null;
  qualifications: string[] | null;
  experience_years: number | null;
  consultation_fee: number | null;
  rating: number;
  total_reviews: number;
  clinic_name: string | null;
  clinic_address?: string | null;
  languages: string[] | null;
  registration_number?: string | null;
  registration_council?: string | null;
  // Supabase-style embed: an object (MySQL adapter) — tolerate an array too
  profiles: { full_name: string; avatar_url: string | null } | { full_name: string; avatar_url: string | null }[] | null;
};

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export type Appointment = {
  id: string;
  appointment_date: string; // YYYY-MM-DD
  appointment_time: string; // HH:MM:SS
  status: AppointmentStatus;
  consultation_type: 'in_person' | 'video' | 'phone';
  chief_complaint: string | null;
  notes: string | null;
  payment_status: 'unpaid' | 'paid' | 'refund_pending' | 'refunded' | 'waived';
  doctor_profiles: {
    id: string;
    specialty: string;
    consultation_fee: number | null;
    profiles: { full_name: string } | { full_name: string }[] | null;
  } | null;
};

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'reminder';
  is_read: boolean;
  created_at: string;
};

export type PatientProfile = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  blood_type: string | null;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
};

/** The embed may come back as an object or a one-item array. */
export function one<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

/** "Sarah Johnson" → "Dr. Sarah Johnson"; leaves names that already start with Dr alone. */
export const withDr = (name: string) => (/^dr\.?\s/i.test(name) ? name : `Dr. ${name}`);

export const doctorName = (d: Pick<Doctor, 'profiles'>) => one(d.profiles)?.full_name ?? 'Doctor';
