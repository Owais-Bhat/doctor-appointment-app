/** Shapes returned by the MedFlow web API (see src/app/api in the web app). */

export type Role = 'patient' | 'doctor' | 'super_admin';

export type Profile = { id: string; role: Role; full_name: string; email: string };

/**
 * The account's role in the words the app knows. Same rule as the website's
 * `normalizeRole`, so "admin", "Super Admin" or "super" all open the admin app
 * and anything unknown is a patient, never an undefined route.
 */
export function normalizeRole(role: unknown): Role {
  const r = String(role ?? '').trim().toLowerCase().replace(/[-_\s]/g, '');
  if (r === 'admin' || r.startsWith('super')) return 'super_admin';
  if (r === 'doctor') return 'doctor';
  return 'patient';
}

export type PrescriptionItem = { name: string; dose: string; frequency: string; duration: string; note: string };
export type Prescription = { items: PrescriptionItem[]; advice: string };

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
  /** The doctor wrote a prescription for this visit */
  has_prescription?: boolean;
  /** Smallest currency unit (paise), once paid */
  amount_paid?: number | null;
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

/* ── Doctor portal ───────────────────────────────────────────────────── */

export type Intake = { duration?: string | null; severity?: string | null; medications?: string | null; allergies?: string | null };

export type PatientBrief = { id: string; full_name: string; phone: string | null; date_of_birth: string | null; blood_type: string | null };

export type DoctorAppointment = {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: AppointmentStatus;
  consultation_type: 'in_person' | 'video' | 'phone';
  chief_complaint: string | null;
  intake: Intake | null;
  notes: string | null;
  payment_status: Appointment['payment_status'];
  amount_paid?: number | null;
  /** Confirmed but not paid online yet. */
  payment_due?: boolean;
  profiles: PatientBrief | PatientBrief[] | null;
};

export type DoctorStats = {
  today_count: number;
  rating: number;
  total_reviews: number;
  revenue_mtd: number;
  collected_mtd: number;
  payments_enabled: boolean;
  total_patients: number;
};

export type AvailabilityRow = {
  id: string;
  day_of_week: number; // 0 = Monday … 6 = Sunday
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  is_active: boolean;
};
export type BlockedDate = { id: string; blocked_date: string; reason: string | null };

export type DoctorOwnProfile = {
  id: string;
  specialty: string;
  bio: string | null;
  qualifications: string[] | null;
  experience_years: number | null;
  consultation_fee: number | null;
  clinic_name: string | null;
  clinic_address: string | null;
  languages: string[] | null;
  registration_number: string | null;
  registration_council: string | null;
  rating: number;
  total_reviews: number;
  is_verified: boolean;
  profiles: { full_name: string; email: string } | { full_name: string; email: string }[] | null;
};

export type MonthlyPoint = { month: string; visits?: number; appointments?: number; revenue?: number; users?: number };

export type DoctorPatientRow = {
  patient_id: string;
  status: AppointmentStatus;
  appointment_date: string;
  chief_complaint: string | null;
  profiles: (PatientBrief & { email: string | null }) | null;
};

/* ── Admin portal ────────────────────────────────────────────────────── */

export type AdminStats = {
  total_users: number;
  new_users_this_month: number;
  suspended_users: number;
  verified_doctors: number;
  pending_doctors: number;
  total_appointments: number;
  appointments_this_month: number;
  total_doctors: number;
};

export type AdminDoctor = {
  id: string;
  specialty: string;
  rating: number;
  total_reviews: number;
  consultation_fee: number | null;
  is_verified: boolean;
  clinic_name: string | null;
  experience_years: number | null;
  registration_number: string | null;
  registration_council: string | null;
  created_at: string;
  profiles: { full_name: string; email: string; is_active: boolean } | { full_name: string; email: string; is_active: boolean }[] | null;
};

export type AdminUser = { id: string; full_name: string; email: string; phone: string | null; role: Role; is_active: boolean; created_at: string };

export type AuditLog = {
  id: string;
  action: string;
  target_table: string | null;
  target_id: string | null;
  created_at: string;
  profiles: { full_name: string; email: string; role: Role } | { full_name: string; email: string; role: Role }[] | null;
};
