/**
 * Insurance Service
 *
 * Handle insurance verification, eligibility checking, and claims management
 */

import { logAuditEvent } from '@/lib/audit/logger';

/**
 * Insurance plan
 */
export interface InsurancePlan {
  planId: string;
  patientId: string;
  memberId: string;
  groupNumber: string;
  insurerName: string;
  insurerId: string;
  planType: 'hmo' | 'ppo' | 'epo' | 'pos' | 'indemnity';
  planName: string;
  effectiveDate: Date;
  terminationDate?: Date;
  groupName: string;
  dependentCode: string;
  relationshipToSubscriber: string;
  isPrimary: boolean;
  isSecondary?: boolean;
  copayOffice: number; // in cents
  copaySpecialist: number;
  copayEmergency: number;
  copayUrgentCare: number;
  deductibleIndividual: number;
  deductibleFamily: number;
  deductibleMet: number;
  maxOutOfPocket: number;
  coinsurance: number; // percentage
  preAuthRequired: boolean;
  preventiveCoverage: boolean;
  mentalHealthCoverage: boolean;
  prescriptionCoverage: boolean;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'inactive' | 'terminated';
}

/**
 * Eligibility check result
 */
export interface EligibilityCheckResult {
  checkId: string;
  patientId: string;
  insuranceId: string;
  checkDate: Date;
  isEligible: boolean;
  effectiveDate: Date;
  terminationDate?: Date;
  coverageType: string;
  benefits: {
    preventiveCare: boolean;
    officeVisit: boolean;
    surgery: boolean;
    mentalHealth: boolean;
    prescriptions: boolean;
  };
  copays: {
    officeVisit: number;
    specialist: number;
    emergency: number;
    urgentCare: number;
  };
  deductible: {
    individual: number;
    family: number;
    remaining: number;
  };
  maxOutOfPocket: number;
  coinsurance: number;
  preAuthRequired: boolean;
  limitations: string[];
  notes: string;
}

/**
 * Insurance claim
 */
export interface InsuranceClaim {
  claimId: string;
  appointmentId: string;
  patientId: string;
  insuranceId: string;
  doctorId: string;
  claimAmount: number;
  submissionDate: Date;
  statusDate: Date;
  status: 'draft' | 'submitted' | 'pending' | 'approved' | 'denied' | 'appealed' | 'paid';
  claimNumber: string;
  serviceDate: Date;
  serviceEndDate?: Date;
  diagnosisCodes: string[]; // ICD-10
  procedureCodes: string[]; // CPT
  serviceDescription: string;
  claimNotes?: string;
  denialReason?: string;
  denialCode?: string;
  paymentAmount?: number;
  paymentDate?: Date;
  eobUrl?: string;
  attachments: {
    fileName: string;
    fileUrl: string;
    uploadDate: Date;
  }[];
}

/**
 * Insurance service
 */
export class InsuranceService {
  private insurancePlans: Map<string, InsurancePlan> = new Map();
  private eligibilityChecks: Map<string, EligibilityCheckResult> = new Map();
  private claims: Map<string, InsuranceClaim> = new Map();

  /**
   * Add insurance plan
   */
  async addInsurancePlan(
    patientId: string,
    data: Omit<InsurancePlan, 'planId' | 'createdAt' | 'updatedAt'>,
    userId: string,
    ipAddress: string
  ): Promise<InsurancePlan> {
    const planId = `insurance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const plan: InsurancePlan = {
      planId,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.insurancePlans.set(planId, plan);

    // Log event
    await logAuditEvent({
      action: 'INSURANCE_PLAN_ADDED',
      resourceType: 'insurance',
      resourceId: planId,
      userId,
      ipAddress,
      details: {
        patientId,
        insurerName: data.insurerName,
        planType: data.planType,
      },
    });

    console.log(`[INSURANCE] Plan added: ${planId}`);

    return plan;
  }

  /**
   * Check eligibility
   */
  async checkEligibility(
    patientId: string,
    insurancePlanId: string,
    serviceDate: Date,
    userId: string,
    ipAddress: string
  ): Promise<EligibilityCheckResult> {
    const plan = this.insurancePlans.get(insurancePlanId);

    if (!plan) {
      throw new Error('Insurance plan not found');
    }

    const checkId = `elig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // TODO: Call real eligibility API
    const result: EligibilityCheckResult = {
      checkId,
      patientId,
      insuranceId: insurancePlanId,
      checkDate: new Date(),
      isEligible: serviceDate >= plan.effectiveDate && (!plan.terminationDate || serviceDate <= plan.terminationDate),
      effectiveDate: plan.effectiveDate,
      terminationDate: plan.terminationDate,
      coverageType: plan.planType,
      benefits: {
        preventiveCare: plan.preventiveCoverage,
        officeVisit: true,
        surgery: true,
        mentalHealth: plan.mentalHealthCoverage,
        prescriptions: plan.prescriptionCoverage,
      },
      copays: {
        officeVisit: plan.copayOffice,
        specialist: plan.copaySpecialist,
        emergency: plan.copayEmergency,
        urgentCare: plan.copayUrgentCare,
      },
      deductible: {
        individual: plan.deductibleIndividual,
        family: plan.deductibleFamily,
        remaining: Math.max(0, plan.deductibleIndividual - plan.deductibleMet),
      },
      maxOutOfPocket: plan.maxOutOfPocket,
      coinsurance: plan.coinsurance,
      preAuthRequired: plan.preAuthRequired,
      limitations: [],
      notes: 'Eligibility verified successfully',
    };

    this.eligibilityChecks.set(checkId, result);

    // Log event
    await logAuditEvent({
      action: 'ELIGIBILITY_CHECKED',
      resourceType: 'insurance',
      resourceId: insurancePlanId,
      userId,
      ipAddress,
      details: {
        patientId,
        isEligible: result.isEligible,
      },
    });

    console.log(`[INSURANCE] Eligibility checked: ${checkId}`);

    return result;
  }

  /**
   * Get patient insurance plans
   */
  async getPatientInsurancePlans(
    patientId: string,
    activeOnly: boolean = false
  ): Promise<InsurancePlan[]> {
    const plans: InsurancePlan[] = [];

    for (const plan of this.insurancePlans.values()) {
      if (plan.patientId === patientId) {
        if (activeOnly && plan.status !== 'active') {
          continue;
        }
        plans.push(plan);
      }
    }

    return plans.sort((a, b) => {
      if (a.isPrimary) return -1;
      if (b.isPrimary) return 1;
      return 0;
    });
  }

  /**
   * Submit claim
   */
  async submitClaim(
    appointmentId: string,
    patientId: string,
    insuranceId: string,
    doctorId: string,
    claimAmount: number,
    diagnosisCodes: string[],
    procedureCodes: string[],
    userId: string,
    ipAddress: string
  ): Promise<InsuranceClaim> {
    const claimId = `claim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const claim: InsuranceClaim = {
      claimId,
      appointmentId,
      patientId,
      insuranceId,
      doctorId,
      claimAmount,
      submissionDate: new Date(),
      statusDate: new Date(),
      status: 'draft',
      claimNumber: `CLM-${Date.now()}`,
      serviceDate: new Date(),
      diagnosisCodes,
      procedureCodes,
      serviceDescription: 'Medical consultation and evaluation',
      attachments: [],
    };

    this.claims.set(claimId, claim);

    // Log event
    await logAuditEvent({
      action: 'CLAIM_CREATED',
      resourceType: 'claim',
      resourceId: claimId,
      userId,
      ipAddress,
      details: {
        patientId,
        claimAmount,
      },
    });

    console.log(`[INSURANCE] Claim created: ${claimId}`);

    return claim;
  }

  /**
   * Submit claim to insurance
   */
  async submitClaimToInsurer(
    claimId: string,
    userId: string,
    ipAddress: string
  ): Promise<InsuranceClaim> {
    const claim = this.claims.get(claimId);

    if (!claim) {
      throw new Error('Claim not found');
    }

    // TODO: Submit to real insurance API
    claim.status = 'submitted';
    claim.submissionDate = new Date();
    claim.statusDate = new Date();

    // Log event
    await logAuditEvent({
      action: 'CLAIM_SUBMITTED',
      resourceType: 'claim',
      resourceId: claimId,
      userId,
      ipAddress,
    });

    console.log(`[INSURANCE] Claim submitted: ${claimId}`);

    return claim;
  }

  /**
   * Get claims for patient
   */
  async getPatientClaims(
    patientId: string,
    status?: string
  ): Promise<InsuranceClaim[]> {
    const claims: InsuranceClaim[] = [];

    for (const claim of this.claims.values()) {
      if (claim.patientId === patientId) {
        if (status && claim.status !== status) {
          continue;
        }
        claims.push(claim);
      }
    }

    return claims.sort((a, b) => b.submissionDate.getTime() - a.submissionDate.getTime());
  }

  /**
   * Update claim status
   */
  async updateClaimStatus(
    claimId: string,
    status: string,
    details?: { denialReason?: string; paymentAmount?: number },
    userId?: string,
    ipAddress?: string
  ): Promise<InsuranceClaim> {
    const claim = this.claims.get(claimId);

    if (!claim) {
      throw new Error('Claim not found');
    }

    claim.status = status as any;
    claim.statusDate = new Date();

    if (details?.denialReason) {
      claim.denialReason = details.denialReason;
    }

    if (details?.paymentAmount !== undefined) {
      claim.paymentAmount = details.paymentAmount;
      claim.paymentDate = new Date();
    }

    if (userId && ipAddress) {
      await logAuditEvent({
        action: 'CLAIM_STATUS_UPDATED',
        resourceType: 'claim',
        resourceId: claimId,
        userId,
        ipAddress,
        details: { newStatus: status },
      });
    }

    console.log(`[INSURANCE] Claim status updated: ${claimId}`);

    return claim;
  }

  /**
   * Calculate patient responsibility
   */
  calculatePatientResponsibility(
    insurancePlanId: string,
    serviceAmount: number,
    isPreventive: boolean = false
  ): { copay: number; coinsurance: number; deductible: number; total: number } {
    const plan = this.insurancePlans.get(insurancePlanId);

    if (!plan) {
      return { copay: 0, coinsurance: 0, deductible: 0, total: 0 };
    }

    let copay = plan.copayOffice;
    let deductible = 0;
    let coinsurance = 0;

    if (isPreventive && plan.preventiveCoverage) {
      copay = 0;
      deductible = 0;
    } else {
      // Apply deductible
      const deductibleRemaining = Math.max(0, plan.deductibleIndividual - plan.deductibleMet);
      deductible = Math.min(serviceAmount, deductibleRemaining);

      // Apply coinsurance on amount after deductible
      const afterDeductible = Math.max(0, serviceAmount - deductible);
      coinsurance = Math.round(afterDeductible * (plan.coinsurance / 100));
    }

    const total = copay + deductible + coinsurance;

    return { copay, coinsurance, deductible, total };
  }

  /**
   * Get insurance stats
   */
  getStats() {
    return {
      totalPlans: this.insurancePlans.size,
      totalClaims: this.claims.size,
      submittedClaims: Array.from(this.claims.values()).filter(
        c => c.status === 'submitted' || c.status === 'paid'
      ).length,
      approvedClaims: Array.from(this.claims.values()).filter(
        c => c.status === 'approved'
      ).length,
      deniedClaims: Array.from(this.claims.values()).filter(
        c => c.status === 'denied'
      ).length,
    };
  }
}

/**
 * Global service instance
 */
export const insuranceService = new InsuranceService();
