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
// Organization & Enterprise Schemas (Phase 2)
// ============================================

export const StaffRoleEnum = z.enum(['admin', 'manager', 'doctor', 'nurse', 'receptionist', 'staff']);

export const OrganizationSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  type: z.enum(['practice', 'clinic', 'hospital', 'group']).default('clinic'),
  taxId: z.string().optional(),
  registrationNumber: z.string().optional(),
  primaryContact: z.object({
    name: z.string().min(1).max(100),
    email: UserEmailSchema,
    phone: PhoneSchema,
  }),
  address: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    zipCode: z.string().min(1),
    country: z.string().min(1),
  }),
  branding: z.object({
    logoUrl: z.string().url().optional(),
    primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
    secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  }).optional(),
  settings: z.object({
    timeZone: z.string().default('UTC'),
    dateFormat: z.string().default('MM/DD/YYYY'),
    appointmentDuration: z.number().default(30),
    maxAdvanceBooking: z.number().default(90),
  }).optional(),
  status: z.enum(['active', 'inactive', 'suspended']).default('active'),
  createdAt: z.coerce.date().optional(),
});

export const ClinicSchema = z.object({
  id: z.string().optional(),
  organizationId: z.string().min(1),
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  address: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    zipCode: z.string().min(1),
    country: z.string().min(1),
  }),
  phone: PhoneSchema,
  email: UserEmailSchema,
  operatingHours: z.object({
    monday: z.object({ open: z.string(), close: z.string() }).optional(),
    tuesday: z.object({ open: z.string(), close: z.string() }).optional(),
    wednesday: z.object({ open: z.string(), close: z.string() }).optional(),
    thursday: z.object({ open: z.string(), close: z.string() }).optional(),
    friday: z.object({ open: z.string(), close: z.string() }).optional(),
    saturday: z.object({ open: z.string(), close: z.string() }).optional(),
    sunday: z.object({ open: z.string(), close: z.string() }).optional(),
  }).optional(),
  capacity: z.number().positive().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
  createdAt: z.coerce.date().optional(),
});

export const StaffMemberSchema = z.object({
  id: z.string().optional(),
  organizationId: z.string().min(1),
  clinicId: z.string().min(1).optional(),
  userId: z.string().min(1),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: UserEmailSchema,
  phone: PhoneSchema,
  role: StaffRoleEnum,
  department: z.string().optional(),
  specialization: z.string().optional(),
  license: z.string().optional(),
  isActive: z.boolean().default(true),
  permissions: z.array(z.string()).optional(),
  createdAt: z.coerce.date().optional(),
});

export const ReferralSchema = z.object({
  id: z.string().optional(),
  patientId: z.string().min(1),
  fromDoctorId: z.string().min(1),
  toDoctorId: z.string().min(1),
  fromClinicId: z.string().min(1),
  toClinicId: z.string().min(1),
  reason: z.string().min(10).max(500),
  urgency: z.enum(['routine', 'urgent', 'emergency']).default('routine'),
  status: z.enum(['pending', 'accepted', 'declined', 'completed']).default('pending'),
  notes: z.string().max(1000).optional(),
  createdAt: z.coerce.date().optional(),
  completedAt: z.coerce.date().optional(),
});

export const DepartmentSchema = z.object({
  id: z.string().optional(),
  organizationId: z.string().min(1),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  head: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
  createdAt: z.coerce.date().optional(),
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
// ============================================
// Insurance & Revenue Cycle Schemas (Phase 2 Week 8)
// ============================================

export const InsurancePlanSchema = z.object({
  id: z.string().optional(),
  patientId: z.string().min(1),
  insuranceCompany: z.string().min(1).max(255),
  planName: z.string().min(1).max(255),
  policyNumber: z.string().min(1).max(50),
  groupNumber: z.string().optional(),
  memberId: z.string().min(1).max(50),
  effectiveDate: z.coerce.date(),
  terminationDate: z.coerce.date().optional(),
  planType: z.enum(['HMO', 'PPO', 'POS', 'EPO', 'HDHP']),
  copay: z.number().nonnegative().optional(),
  deductible: z.number().nonnegative().optional(),
  outOfPocketMax: z.number().nonnegative().optional(),
  coinsurance: z.number().min(0).max(100).optional(),
  isSelfPay: z.boolean().default(false),
  isPrimary: z.boolean().default(true),
  status: z.enum(['active', 'inactive', 'pending']).default('active'),
  createdAt: z.coerce.date().optional(),
});

export const EligibilityCheckSchema = z.object({
  id: z.string().optional(),
  patientId: z.string().min(1),
  insurancePlanId: z.string().min(1),
  checkDate: z.coerce.date(),
  isEligible: z.boolean(),
  effectiveDate: z.coerce.date().optional(),
  terminationDate: z.coerce.date().optional(),
  copay: z.number().nonnegative().optional(),
  deductible: z.number().nonnegative().optional(),
  deductibleMet: z.number().nonnegative().optional(),
  outOfPocketMax: z.number().nonnegative().optional(),
  outOfPocketMet: z.number().nonnegative().optional(),
  limitations: z.string().max(1000).optional(),
  requiresAuth: z.boolean().default(false),
  status: z.enum(['verified', 'pending', 'error']).default('pending'),
});

export const AuthorizationSchema = z.object({
  id: z.string().optional(),
  appointmentId: z.string().min(1),
  patientId: z.string().min(1),
  insurancePlanId: z.string().min(1),
  authNumber: z.string().min(1).max(50),
  serviceType: z.string().min(1).max(100),
  units: z.number().positive(),
  validFrom: z.coerce.date(),
  validUntil: z.coerce.date(),
  status: z.enum(['pending', 'approved', 'denied', 'expired']).default('pending'),
  notes: z.string().max(500).optional(),
  requestedAt: z.coerce.date().optional(),
  approvedAt: z.coerce.date().optional(),
});

export const ClaimSchema = z.object({
  id: z.string().optional(),
  appointmentId: z.string().min(1),
  patientId: z.string().min(1),
  clinicId: z.string().min(1),
  doctorId: z.string().min(1),
  insurancePlanId: z.string().min(1),
  claimNumber: z.string().optional(),
  serviceDate: z.coerce.date(),
  submissionDate: z.coerce.date().optional(),
  totalCharges: z.number().positive(),
  allowedAmount: z.number().nonnegative().optional(),
  patientResponsibility: z.number().nonnegative().optional(),
  insurancePays: z.number().nonnegative().optional(),
  copay: z.number().nonnegative().optional(),
  deductibleApplied: z.number().nonnegative().optional(),
  coinsuranceAmount: z.number().nonnegative().optional(),
  serviceCode: z.string().max(10).optional(),
  modifier: z.string().max(4).optional(),
  status: z.enum(['draft', 'submitted', 'pending', 'accepted', 'denied', 'paid']).default('draft'),
  denialReason: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
  createdAt: z.coerce.date().optional(),
  submittedAt: z.coerce.date().optional(),
});

export const PatientResponsibilitySchema = z.object({
  id: z.string().optional(),
  patientId: z.string().min(1),
  appointmentId: z.string().min(1),
  estimatedCopay: z.number().nonnegative(),
  estimatedDeductible: z.number().nonnegative(),
  estimatedCoinsurance: z.number().nonnegative(),
  estimatedTotal: z.number().nonnegative(),
  actualCopay: z.number().nonnegative().optional(),
  actualDeductible: z.number().nonnegative().optional(),
  actualCoinsurance: z.number().nonnegative().optional(),
  actualTotal: z.number().nonnegative().optional(),
  amountPaid: z.number().nonnegative().default(0),
  status: z.enum(['estimated', 'finalized', 'paid', 'outstanding']).default('estimated'),
  createdAt: z.coerce.date().optional(),
  finalizedAt: z.coerce.date().optional(),
});

export const DenialAppealSchema = z.object({
  id: z.string().optional(),
  claimId: z.string().min(1),
  patientId: z.string().min(1),
  appointmentId: z.string().min(1),
  denialReason: z.string().min(1).max(500),
  appealReason: z.string().min(10).max(1000),
  supportingDocuments: z.array(z.string().url()).optional(),
  status: z.enum(['submitted', 'under_review', 'approved', 'denied']).default('submitted'),
  submittedAt: z.coerce.date().optional(),
  resolvedAt: z.coerce.date().optional(),
  resolution: z.string().max(500).optional(),
});

export const InsuranceProviderSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(255),
  npi: z.string().min(10).max(10),
  clearinghouseId: z.string().optional(),
  supportedTransactions: z.array(z.string()).optional(),
  contactName: z.string().optional(),
  contactEmail: UserEmailSchema.optional(),
  contactPhone: PhoneSchema.optional(),
  ediCapable: z.boolean().default(false),
  status: z.enum(['active', 'inactive']).default('active'),
});

// ============================================
// Type Exports (for TypeScript)
// ============================================

// ============================================
// Analytics & Reporting Schemas (Phase 2 Week 9)
// ============================================

export const RevenueMetricsSchema = z.object({
  period: z.string(), // YYYY-MM or YYYY-MM-DD
  totalRevenue: z.number().nonnegative(),
  insuranceRevenue: z.number().nonnegative(),
  patientRevenue: z.number().nonnegative(),
  averageClaimValue: z.number().nonnegative(),
  appointmentsCount: z.number().nonnegative(),
  claimsSubmitted: z.number().nonnegative(),
  claimsPaid: z.number().nonnegative(),
  claimsDenied: z.number().nonnegative(),
  denialRate: z.number().min(0).max(100),
});

export const OperationalMetricsSchema = z.object({
  period: z.string(),
  appointmentsScheduled: z.number().nonnegative(),
  appointmentsCompleted: z.number().nonnegative(),
  appointmentsCancelled: z.number().nonnegative(),
  noShowRate: z.number().min(0).max(100),
  avgWaitTime: z.number().nonnegative(),
  appointmentUtilization: z.number().min(0).max(100),
  patientAcquisitionCost: z.number().nonnegative(),
  patientRetentionRate: z.number().min(0).max(100),
  doctorAvailability: z.number().min(0).max(100),
});

export const ClinicalMetricsSchema = z.object({
  period: z.string(),
  patientSatisfactionScore: z.number().min(0).max(5),
  treatmentCompletionRate: z.number().min(0).max(100),
  readmissionRate: z.number().min(0).max(100),
  prescriptionFillRate: z.number().min(0).max(100),
  referralCompletionRate: z.number().min(0).max(100),
  avgOutcomeScore: z.number().min(0).max(100),
});

export const DoctorPerformanceSchema = z.object({
  doctorId: z.string(),
  doctorName: z.string(),
  period: z.string(),
  appointmentsCount: z.number().nonnegative(),
  averageRating: z.number().min(0).max(5),
  patientSatisfaction: z.number().min(0).max(100),
  revenueGenerated: z.number().nonnegative(),
  claimsDenialRate: z.number().min(0).max(100),
  noShowRate: z.number().min(0).max(100),
  avgConsultationTime: z.number().nonnegative(),
});

export const ClinicPerformanceSchema = z.object({
  clinicId: z.string(),
  clinicName: z.string(),
  period: z.string(),
  totalRevenue: z.number().nonnegative(),
  appointmentsCompleted: z.number().nonnegative(),
  patientCount: z.number().nonnegative(),
  staffCount: z.number().nonnegative(),
  avgPatientSatisfaction: z.number().min(0).max(100),
  utilizationRate: z.number().min(0).max(100),
});

export const InsuranceAnalyticsSchema = z.object({
  insuranceCompany: z.string(),
  period: z.string(),
  claimsSubmitted: z.number().nonnegative(),
  claimsPaid: z.number().nonnegative(),
  claimsDenied: z.number().nonnegative(),
  totalClaims: z.number().nonnegative(),
  totalAllowed: z.number().nonnegative(),
  totalPaid: z.number().nonnegative(),
  avgProcessingTime: z.number().nonnegative(),
  denialRate: z.number().min(0).max(100),
  topDenialReasons: z.array(z.string()).optional(),
});

export const ReportSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  reportType: z.enum(['revenue', 'operational', 'clinical', 'insurance', 'performance', 'custom']),
  organizationId: z.string(),
  clinicId: z.string().optional(),
  createdBy: z.string(),
  parameters: z.record(z.any()).optional(),
  schedule: z.enum(['once', 'daily', 'weekly', 'monthly', 'quarterly', 'annually']).optional(),
  emailRecipients: z.array(UserEmailSchema).optional(),
  format: z.enum(['pdf', 'csv', 'excel', 'html']).default('pdf'),
  createdAt: z.coerce.date().optional(),
  lastRunAt: z.coerce.date().optional(),
});

export const BenchmarkSchema = z.object({
  metricName: z.string(),
  organizationId: z.string(),
  organizationValue: z.number(),
  industryAverage: z.number(),
  industryMin: z.number(),
  industryMax: z.number(),
  percentile: z.number().min(0).max(100),
  trend: z.enum(['up', 'down', 'stable']),
  period: z.string(),
});

export const KPISchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  metric: z.string(),
  targetValue: z.number(),
  currentValue: z.number(),
  threshold: z.enum(['warning', 'critical', 'healthy']),
  trendDirection: z.enum(['up', 'down', 'stable']),
  lastUpdated: z.coerce.date().optional(),
});

export type Organization = z.infer<typeof OrganizationSchema>;
export type Clinic = z.infer<typeof ClinicSchema>;
export type StaffMember = z.infer<typeof StaffMemberSchema>;
export type Referral = z.infer<typeof ReferralSchema>;
export type Department = z.infer<typeof DepartmentSchema>;
export type InsurancePlan = z.infer<typeof InsurancePlanSchema>;
export type EligibilityCheck = z.infer<typeof EligibilityCheckSchema>;
export type Authorization = z.infer<typeof AuthorizationSchema>;
export type Claim = z.infer<typeof ClaimSchema>;
export type PatientResponsibility = z.infer<typeof PatientResponsibilitySchema>;
export type DenialAppeal = z.infer<typeof DenialAppealSchema>;
export type InsuranceProvider = z.infer<typeof InsuranceProviderSchema>;
export type RevenueMetrics = z.infer<typeof RevenueMetricsSchema>;
export type OperationalMetrics = z.infer<typeof OperationalMetricsSchema>;
export type ClinicalMetrics = z.infer<typeof ClinicalMetricsSchema>;
export type DoctorPerformance = z.infer<typeof DoctorPerformanceSchema>;
export type ClinicPerformance = z.infer<typeof ClinicPerformanceSchema>;
export type InsuranceAnalytics = z.infer<typeof InsuranceAnalyticsSchema>;
export type Report = z.infer<typeof ReportSchema>;
export type Benchmark = z.infer<typeof BenchmarkSchema>;
export type KPI = z.infer<typeof KPISchema>;
