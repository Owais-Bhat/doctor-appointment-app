/**
 * Zod Validation Schemas
 *
 * Central validation schemas for all data types
 * Used in API routes and form submissions
 */

import { z } from 'zod';

// ============================================
// User/Auth Schemas
// ============================================

export const UserEmailSchema = z
  .string()
  .email('Invalid email format')
  .toLowerCase()
  .max(255, 'Email must be less than 255 characters');

export const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*]/, 'Password must contain at least one special character');

export const PhoneSchema = z
  .string()
  .regex(
    /^(\+1)?[-.]?\(?([0-9]{3})\)?[-.]?([0-9]{3})[-.]?([0-9]{4})$/,
    'Invalid phone number format'
  );

export const LoginSchema = z.object({
  email: UserEmailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const RegisterSchema = z
  .object({
    firstName: z
      .string()
      .min(1, 'First name is required')
      .max(100, 'First name is too long'),
    lastName: z
      .string()
      .min(1, 'Last name is required')
      .max(100, 'Last name is too long'),
    email: UserEmailSchema,
    password: PasswordSchema,
    confirmPassword: z.string(),
    userType: z.enum(['patient', 'doctor', 'admin']),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// ============================================
// Patient Schemas
// ============================================

export const PatientProfileSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: UserEmailSchema,
  phone: PhoneSchema,
  dateOfBirth: z.coerce.date().refine(
    (date) => {
      const age = new Date().getFullYear() - date.getFullYear();
      return age >= 18 && age <= 120;
    },
    'Invalid date of birth'
  ),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']),
  bloodType: z.enum(['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']).optional(),
  allergies: z.string().max(500).optional(),
  medicalHistory: z.string().max(1000).optional(),
  emergencyContact: z.object({
    name: z.string(),
    phone: PhoneSchema,
    relationship: z.string(),
  }).optional(),
});

// ============================================
// Doctor Schemas
// ============================================

export const DoctorProfileSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: UserEmailSchema,
  phone: PhoneSchema,
  speciality: z.string().min(1).max(100),
  license: z.string().min(5).max(50),
  yearsOfExperience: z.number().min(0).max(70),
  bio: z.string().max(500).optional(),
  rating: z.number().min(0).max(5).optional(),
  isAvailable: z.boolean().default(true),
  consultationFee: z.number().positive('Fee must be greater than 0'),
  consultationDuration: z.number().positive('Duration must be greater than 0'),
});

// ============================================
// Appointment Schemas
// ============================================

export const AppointmentSchema = z.object({
  id: z.string().optional(),
  patientId: z.string().min(1),
  doctorId: z.string().min(1),
  appointmentDate: z.coerce.date().refine(
    (date) => date > new Date(),
    'Appointment must be in the future'
  ),
  timeSlot: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  type: z.enum(['in_person', 'video', 'phone']),
  reason: z.string().min(10, 'Please provide a reason for appointment').max(500),
  status: z.enum(['scheduled', 'confirmed', 'completed', 'cancelled']).optional(),
  notes: z.string().max(1000).optional(),
});

export const UpdateAppointmentSchema = AppointmentSchema.partial({
  patientId: true,
  doctorId: true,
});

// ============================================
// Prescription Schemas
// ============================================

export const PrescriptionSchema = z.object({
  id: z.string().optional(),
  appointmentId: z.string().min(1),
  patientId: z.string().min(1),
  doctorId: z.string().min(1),
  medication: z.string().min(1).max(255),
  dosage: z.string().min(1).max(100),
  frequency: z.enum(['once_daily', 'twice_daily', 'thrice_daily', 'as_needed']),
  duration: z.string().min(1).max(100),
  instructions: z.string().max(500).optional(),
  issuedDate: z.coerce.date().optional(),
});

// ============================================
// Medical Record Schemas
// ============================================

export const MedicalRecordSchema = z.object({
  id: z.string().optional(),
  patientId: z.string().min(1),
  recordType: z.enum(['lab_test', 'imaging', 'prescription', 'report', 'other']),
  fileName: z.string().min(1).max(255),
  fileUrl: z.string().url('Invalid file URL'),
  fileSize: z.number().positive('File size must be positive'),
  uploadedDate: z.coerce.date().optional(),
  createdBy: z.string().min(1),
  description: z.string().max(500).optional(),
});

// ============================================
// Review/Rating Schemas
// ============================================

export const ReviewSchema = z.object({
  id: z.string().optional(),
  doctorId: z.string().min(1),
  patientId: z.string().min(1),
  appointmentId: z.string().min(1),
  rating: z.number().min(1).max(5),
  comment: z.string().min(10).max(500).optional(),
  createdAt: z.coerce.date().optional(),
});

// ============================================
// Payment Schemas
// ============================================

export const PaymentSchema = z.object({
  id: z.string().optional(),
  appointmentId: z.string().min(1),
  patientId: z.string().min(1),
  amount: z.number().positive('Amount must be greater than 0'),
  currency: z.string().length(3, 'Invalid currency code').default('USD'),
  status: z.enum(['pending', 'completed', 'failed', 'refunded']).optional(),
  method: z.enum(['credit_card', 'debit_card', 'paypal', 'bank_transfer']),
  transactionId: z.string().optional(),
  createdAt: z.coerce.date().optional(),
});

// ============================================
// Notification Schemas
// ============================================

export const NotificationSchema = z.object({
  id: z.string().optional(),
  userId: z.string().min(1),
  type: z.enum(['appointment', 'prescription', 'medical_record', 'payment', 'system']),
  title: z.string().min(1).max(255),
  message: z.string().min(1).max(1000),
  read: z.boolean().default(false),
  createdAt: z.coerce.date().optional(),
  actionUrl: z.string().url().optional(),
});

// ============================================
// Query/Filter Schemas
// ============================================

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const DoctorFilterSchema = z.object({
  speciality: z.string().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  isAvailable: z.coerce.boolean().optional(),
  ...PaginationSchema.shape,
});

export const AppointmentFilterSchema = z.object({
  status: z.enum(['scheduled', 'confirmed', 'completed', 'cancelled']).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  doctorId: z.string().optional(),
  ...PaginationSchema.shape,
});

// ============================================
// Type Exports (for TypeScript)
// ============================================

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type PatientProfile = z.infer<typeof PatientProfileSchema>;
export type DoctorProfile = z.infer<typeof DoctorProfileSchema>;
export type Appointment = z.infer<typeof AppointmentSchema>;
export type Prescription = z.infer<typeof PrescriptionSchema>;
export type MedicalRecord = z.infer<typeof MedicalRecordSchema>;
export type Review = z.infer<typeof ReviewSchema>;
export type Payment = z.infer<typeof PaymentSchema>;
export type Notification = z.infer<typeof NotificationSchema>;
