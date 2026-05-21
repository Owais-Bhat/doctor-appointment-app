/**
 * Prescription Service
 *
 * Manage prescriptions, refills, and pharmacy integration
 */

import { invalidateCacheTag, CacheTTL, CacheTags } from '@/lib/cache/cacheManager';
import { logAuditEvent, logPatientDataAccess } from '@/lib/audit/logger';

/**
 * Prescription frequency
 */
export enum PrescriptionFrequency {
  ONCE = 'once',
  DAILY = 'daily',
  TWICE_DAILY = 'twice_daily',
  THREE_TIMES_DAILY = 'three_times_daily',
  FOUR_TIMES_DAILY = 'four_times_daily',
  AS_NEEDED = 'as_needed',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

/**
 * Prescription status
 */
export enum PrescriptionStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  FILLED = 'filled',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

/**
 * Prescription object
 */
export interface Prescription {
  prescriptionId: string;
  appointmentId?: string;
  patientId: string;
  doctorId: string;
  medication: string;
  dosage: string; // e.g., "500mg"
  frequency: PrescriptionFrequency;
  duration: string; // e.g., "7 days", "3 months"
  quantity: number;
  refillsRemaining: number;
  refillsMax: number;
  instructions?: string;
  status: PrescriptionStatus;
  issuedAt: Date;
  expiresAt: Date;
  filledAt?: Date;
  filledPharmacy?: string;
  cancelledAt?: Date;
  cancelReason?: string;
  sideEffects?: string[];
  interactions?: string[];
  notes?: string;
}

/**
 * Refill request
 */
export interface RefillRequest {
  refillId: string;
  prescriptionId: string;
  patientId: string;
  requestedAt: Date;
  status: 'pending' | 'approved' | 'denied';
  approvedAt?: Date;
  approvedBy?: string;
  denialReason?: string;
}

/**
 * Pharmacy
 */
export interface Pharmacy {
  pharmacyId: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  npi: string;
  supportedFormats: string[]; // electronic, fax, print
}

/**
 * Prescription service
 */
export class PrescriptionService {
  private prescriptions: Map<string, Prescription> = new Map();
  private refillRequests: Map<string, RefillRequest> = new Map();
  private pharmacies: Map<string, Pharmacy> = new Map();

  /**
   * Create prescription
   */
  async createPrescription(
    patientId: string,
    doctorId: string,
    medication: string,
    dosage: string,
    frequency: PrescriptionFrequency,
    duration: string,
    quantity: number,
    refillsMax: number,
    userId: string,
    ipAddress: string,
    appointmentId?: string,
    instructions?: string,
    notes?: string
  ): Promise<Prescription> {
    const prescriptionId = `rx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Calculate expiration date
    const expiresAt = this.calculateExpirationDate(duration);

    const prescription: Prescription = {
      prescriptionId,
      appointmentId,
      patientId,
      doctorId,
      medication,
      dosage,
      frequency,
      duration,
      quantity,
      refillsRemaining: refillsMax,
      refillsMax,
      instructions,
      status: PrescriptionStatus.PENDING,
      issuedAt: new Date(),
      expiresAt,
      notes,
    };

    this.prescriptions.set(prescriptionId, prescription);

    // Log event
    await logAuditEvent({
      action: 'PRESCRIPTION_CREATED',
      resourceType: 'prescription',
      resourceId: prescriptionId,
      userId,
      ipAddress,
      details: {
        patientId,
        medication,
        dosage,
        frequency,
        refillsMax,
      },
    });

    // Log HIPAA access
    await logPatientDataAccess({
      patientId,
      accessType: 'create',
      recordType: 'prescription',
      resourceId: prescriptionId,
      userId,
      ipAddress,
    });

    // Invalidate cache
    invalidateCacheTag(CacheTags.PRESCRIPTIONS);

    console.log(`[PRESCRIPTION] Created: ${prescriptionId}`);

    return prescription;
  }

  /**
   * Calculate expiration date from duration string
   */
  private calculateExpirationDate(duration: string): Date {
    const now = new Date();

    // Parse duration (e.g., "7 days", "3 months", "1 year")
    const match = duration.match(/(\d+)\s*(day|week|month|year)s?/i);
    if (!match) {
      return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // Default 1 year
    }

    const [, amount, unit] = match;
    const num = parseInt(amount);
    const normalizedUnit = unit.toLowerCase();

    switch (normalizedUnit) {
      case 'day':
        now.setDate(now.getDate() + num);
        break;
      case 'week':
        now.setDate(now.getDate() + num * 7);
        break;
      case 'month':
        now.setMonth(now.getMonth() + num);
        break;
      case 'year':
        now.setFullYear(now.getFullYear() + num);
        break;
    }

    return now;
  }

  /**
   * Get patient prescriptions
   */
  async getPatientPrescriptions(
    patientId: string,
    userId: string,
    ipAddress: string,
    includeExpired: boolean = false
  ): Promise<Prescription[]> {
    const prescriptions: Prescription[] = [];

    for (const rx of this.prescriptions.values()) {
      if (rx.patientId === patientId) {
        // Filter expired if not included
        if (!includeExpired && rx.expiresAt < new Date()) {
          continue;
        }

        prescriptions.push(rx);
      }
    }

    // Log access
    await logPatientDataAccess({
      patientId,
      accessType: 'read',
      recordType: 'prescriptions_list',
      userId,
      ipAddress,
      details: { prescriptionCount: prescriptions.length },
    });

    console.log(`[PRESCRIPTION] Retrieved ${prescriptions.length} for ${patientId}`);

    return prescriptions.sort((a, b) => b.issuedAt.getTime() - a.issuedAt.getTime());
  }

  /**
   * Get active prescriptions
   */
  async getActivePrescriptions(
    patientId: string,
    userId: string,
    ipAddress: string
  ): Promise<Prescription[]> {
    const prescriptions = await this.getPatientPrescriptions(
      patientId,
      userId,
      ipAddress,
      false
    );

    return prescriptions.filter(
      (rx) =>
        rx.status === PrescriptionStatus.ACTIVE ||
        rx.status === PrescriptionStatus.PENDING
    );
  }

  /**
   * Get prescription by ID
   */
  async getPrescription(
    prescriptionId: string,
    userId: string,
    ipAddress: string
  ): Promise<Prescription | null> {
    const prescription = this.prescriptions.get(prescriptionId);

    if (!prescription) {
      return null;
    }

    // Log access
    await logPatientDataAccess({
      patientId: prescription.patientId,
      accessType: 'read',
      recordType: 'prescription',
      resourceId: prescriptionId,
      userId,
      ipAddress,
    });

    return prescription;
  }

  /**
   * Mark prescription as filled
   */
  async markAsFilled(
    prescriptionId: string,
    pharmacyId: string,
    pharmacyName: string,
    userId: string,
    ipAddress: string
  ): Promise<Prescription> {
    const prescription = this.prescriptions.get(prescriptionId);

    if (!prescription) {
      throw new Error('Prescription not found');
    }

    prescription.status = PrescriptionStatus.FILLED;
    prescription.filledAt = new Date();
    prescription.filledPharmacy = pharmacyName;

    // Log event
    await logAuditEvent({
      action: 'PRESCRIPTION_FILLED',
      resourceType: 'prescription',
      resourceId: prescriptionId,
      userId,
      ipAddress,
      details: { patientId: prescription.patientId, pharmacyId },
    });

    invalidateCacheTag(CacheTags.PRESCRIPTIONS);

    console.log(`[PRESCRIPTION] Marked filled: ${prescriptionId}`);

    return prescription;
  }

  /**
   * Request refill
   */
  async requestRefill(
    prescriptionId: string,
    userId: string,
    ipAddress: string
  ): Promise<RefillRequest> {
    const prescription = this.prescriptions.get(prescriptionId);

    if (!prescription) {
      throw new Error('Prescription not found');
    }

    // Check if refills available
    if (prescription.refillsRemaining <= 0) {
      throw new Error('No refills remaining');
    }

    // Check if expired
    if (prescription.expiresAt < new Date()) {
      throw new Error('Prescription expired');
    }

    const refillId = `refill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const refillRequest: RefillRequest = {
      refillId,
      prescriptionId,
      patientId: prescription.patientId,
      requestedAt: new Date(),
      status: 'pending',
    };

    this.refillRequests.set(refillId, refillRequest);

    // Log event
    await logAuditEvent({
      action: 'PRESCRIPTION_REFILL_REQUESTED',
      resourceType: 'prescription',
      resourceId: prescriptionId,
      userId,
      ipAddress,
      details: { patientId: prescription.patientId },
    });

    console.log(`[PRESCRIPTION] Refill requested: ${refillId}`);

    return refillRequest;
  }

  /**
   * Approve refill
   */
  async approveRefill(
    refillId: string,
    doctorId: string,
    userId: string,
    ipAddress: string
  ): Promise<RefillRequest> {
    const refillRequest = this.refillRequests.get(refillId);

    if (!refillRequest) {
      throw new Error('Refill request not found');
    }

    const prescription = this.prescriptions.get(refillRequest.prescriptionId);
    if (!prescription) {
      throw new Error('Prescription not found');
    }

    // Verify doctor
    if (prescription.doctorId !== doctorId) {
      throw new Error('Only prescribing doctor can approve refill');
    }

    refillRequest.status = 'approved';
    refillRequest.approvedAt = new Date();
    refillRequest.approvedBy = doctorId;

    // Update prescription
    prescription.refillsRemaining--;
    prescription.status = PrescriptionStatus.ACTIVE;

    // Log event
    await logAuditEvent({
      action: 'PRESCRIPTION_REFILL_APPROVED',
      resourceType: 'prescription',
      resourceId: refillRequest.prescriptionId,
      userId,
      ipAddress,
      details: { patientId: refillRequest.patientId, doctorId },
    });

    invalidateCacheTag(CacheTags.PRESCRIPTIONS);

    console.log(`[PRESCRIPTION] Refill approved: ${refillId}`);

    return refillRequest;
  }

  /**
   * Deny refill
   */
  async denyRefill(
    refillId: string,
    reason: string,
    doctorId: string,
    userId: string,
    ipAddress: string
  ): Promise<RefillRequest> {
    const refillRequest = this.refillRequests.get(refillId);

    if (!refillRequest) {
      throw new Error('Refill request not found');
    }

    refillRequest.status = 'denied';
    refillRequest.denialReason = reason;

    // Log event
    await logAuditEvent({
      action: 'PRESCRIPTION_REFILL_DENIED',
      resourceType: 'prescription',
      resourceId: refillRequest.prescriptionId,
      userId,
      ipAddress,
      details: { patientId: refillRequest.patientId, reason },
    });

    console.log(`[PRESCRIPTION] Refill denied: ${refillId}`);

    return refillRequest;
  }

  /**
   * Cancel prescription
   */
  async cancelPrescription(
    prescriptionId: string,
    reason: string,
    userId: string,
    ipAddress: string
  ): Promise<Prescription> {
    const prescription = this.prescriptions.get(prescriptionId);

    if (!prescription) {
      throw new Error('Prescription not found');
    }

    prescription.status = PrescriptionStatus.CANCELLED;
    prescription.cancelledAt = new Date();
    prescription.cancelReason = reason;

    // Log event
    await logAuditEvent({
      action: 'PRESCRIPTION_CANCELLED',
      resourceType: 'prescription',
      resourceId: prescriptionId,
      userId,
      ipAddress,
      details: { patientId: prescription.patientId, reason },
    });

    invalidateCacheTag(CacheTags.PRESCRIPTIONS);

    console.log(`[PRESCRIPTION] Cancelled: ${prescriptionId}`);

    return prescription;
  }

  /**
   * Get refill requests
   */
  async getRefillRequests(
    patientId: string,
    status?: string
  ): Promise<RefillRequest[]> {
    const requests: RefillRequest[] = [];

    for (const request of this.refillRequests.values()) {
      if (request.patientId === patientId) {
        if (status && request.status !== status) {
          continue;
        }
        requests.push(request);
      }
    }

    return requests;
  }

  /**
   * Get prescription stats
   */
  getStats(patientId?: string) {
    let filteredRx = Array.from(this.prescriptions.values());

    if (patientId) {
      filteredRx = filteredRx.filter((rx) => rx.patientId === patientId);
    }

    const now = new Date();
    const active = filteredRx.filter(
      (rx) =>
        rx.status === PrescriptionStatus.ACTIVE &&
        rx.expiresAt > now
    );
    const expired = filteredRx.filter((rx) => rx.expiresAt < now);
    const filled = filteredRx.filter((rx) => rx.status === PrescriptionStatus.FILLED);

    return {
      total: filteredRx.length,
      active: active.length,
      expired: expired.length,
      filled: filled.length,
      pendingRefills: Array.from(this.refillRequests.values()).filter(
        (r) => r.status === 'pending' && (!patientId || r.patientId === patientId)
      ).length,
    };
  }

  /**
   * Clean up expired prescriptions
   */
  cleanup(): number {
    const now = new Date();
    let cleaned = 0;

    for (const [id, rx] of this.prescriptions.entries()) {
      if (rx.expiresAt < now && rx.status !== PrescriptionStatus.ACTIVE) {
        rx.status = PrescriptionStatus.EXPIRED;
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[PRESCRIPTION] Marked ${cleaned} as expired`);
    }

    return cleaned;
  }
}

/**
 * Global service instance
 */
export const prescriptionService = new PrescriptionService();
