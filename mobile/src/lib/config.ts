/** The MedFlow web app that serves the /api routes this app talks to. */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://app.nestfy.in').replace(/\/$/, '');

/** Same clinic time zone as the web app. */
export const TIME_ZONE = process.env.EXPO_PUBLIC_TIME_ZONE || 'Asia/Kolkata';

export const CURRENCY = process.env.EXPO_PUBLIC_CURRENCY || 'INR';

export const CONSULTATION_TYPES = [
  { value: 'in_person', label: 'In person', icon: 'hospital' },
  { value: 'video', label: 'Video', icon: 'video' },
  { value: 'phone', label: 'Phone', icon: 'phone' },
] as const;

export type ConsultationType = (typeof CONSULTATION_TYPES)[number]['value'];

export const SPECIALTIES = [
  'General Medicine', 'Cardiology', 'Dermatology', 'Pediatrics', 'Gynecology', 'Orthopedics',
  'Neurology', 'ENT', 'Ophthalmology', 'Psychiatry', 'Gastroenterology', 'Dentistry',
] as const;
