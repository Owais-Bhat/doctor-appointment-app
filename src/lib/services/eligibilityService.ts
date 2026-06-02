/**
 * Eligibility Service
 *
 * Verifies patient eligibility and benefits from insurance
 * Handles real-time eligibility checks and benefit lookups
 */

import { EligibilityCheck, EligibilityCheckSchema } from '@/lib/validations';
import { logAudit, AuditAction } from '@/lib/audit/logger';
import { errorResponse, ApiErrors } from '@/lib/api/response';
import { z } from 'zod';

export class EligibilityService {
  /**
   * Check patient eligibility with insurance
   */
  static async checkEligibility(
    patientId: string,
    planId: string,
    userId: string,
    ipAddress?: string | null
  ) {
    try {
      // TODO: Call insurance verification API (clearinghouse/EDI)
      const eligibilityData = await this.queryInsuranceEligibility(patientId, planId);

      const check: z.infer<typeof EligibilityCheckSchema> = {
        patientId,
        insurancePlanId: planId,
        checkDate: new Date(),
        isEligible: eligibilityData.isEligible,
        effectiveDate: eligibilityData.effectiveDate,
        terminationDate: eligibilityData.terminationDate,
        copay: eligibilityData.copay,
        deductible: eligibilityData.deductible,
        deductibleMet: eligibilityData.deductibleMet,
        outOfPocketMax: eligibilityData.outOfPocketMax,
        outOfPocketMet: eligibilityData.outOfPocketMet,
        limitations: eligibilityData.limitations,
        requiresAuth: eligibilityData.requiresAuth,
        status: 'verified',
      };

      const validated = EligibilityCheckSchema.parse(check);
      const saved = await this.saveEligibilityCheckToDatabase(validated);

      await logAudit(
        userId,
        AuditAction.ELIGIBILITY_CHECKED,
        'ELIGIBILITY',
        saved.id,
        {
          ipAddress,
          details: {
            patientId,
            planId,
            isEligible: eligibilityData.isEligible,
          },
        }
      );

      return { status: 200, body: { success: true, data: saved } };
    } catch (error) {
      console.error('Error checking eligibility:', error);
      return ApiErrors.internalError('Failed to check eligibility');
    }
  }

  /**
   * Get eligibility benefits summary
   */
  static async getEligibilityBenefits(
    patientId: string,
    planId: string,
    userId: string
  ) {
    try {
      const check = await this.fetchLatestEligibilityCheck(patientId, planId);

      if (!check) {
        return ApiErrors.notFound('Eligibility check');
      }

      const benefits = {
        copay: check.copay,
        deductible: check.deductible,
        deductibleMet: check.deductibleMet,
        outOfPocketMax: check.outOfPocketMax,
        outOfPocketMet: check.outOfPocketMet,
        coinsurancePercentage: 20, // TODO: Get from insurance data
        requiresAuthorization: check.requiresAuth,
        limitations: check.limitations,
      };

      return { status: 200, body: { success: true, data: benefits } };
    } catch (error) {
      console.error('Error fetching benefits:', error);
      return ApiErrors.internalError();
    }
  }

  /**
   * Check if authorization is required
   */
  static async requiresAuthorization(
    patientId: string,
    planId: string,
    serviceType: string
  ): Promise<boolean> {
    try {
      const check = await this.fetchLatestEligibilityCheck(patientId, planId);
      if (!check) return false;

      // Check if service requires authorization
      return check.requiresAuth || this.isServiceTypeRequiringAuth(serviceType);
    } catch (error) {
      console.error('Error checking authorization requirement:', error);
      return false;
    }
  }

  /**
   * Get deductible remaining
   */
  static async getDeductibleRemaining(
    patientId: string,
    planId: string
  ): Promise<number> {
    try {
      const check = await this.fetchLatestEligibilityCheck(patientId, planId);
      if (!check || !check.deductible) return 0;

      const deductibleMet = check.deductibleMet || 0;
      return Math.max(0, check.deductible - deductibleMet);
    } catch (error) {
      console.error('Error calculating deductible remaining:', error);
      return 0;
    }
  }

  /**
   * Get out-of-pocket remaining
   */
  static async getOutOfPocketRemaining(
    patientId: string,
    planId: string
  ): Promise<number> {
    try {
      const check = await this.fetchLatestEligibilityCheck(patientId, planId);
      if (!check || !check.outOfPocketMax) return 0;

      const outOfPocketMet = check.outOfPocketMet || 0;
      return Math.max(0, check.outOfPocketMax - outOfPocketMet);
    } catch (error) {
      console.error('Error calculating out-of-pocket remaining:', error);
      return 0;
    }
  }

  /**
   * Get eligibility history
   */
  static async getEligibilityHistory(
    patientId: string,
    planId: string,
    limit: number = 10
  ) {
    try {
      const checks = await this.fetchEligibilityCheckHistoryFromDatabase(
        patientId,
        planId,
        limit
      );

      return { status: 200, body: { success: true, data: checks } };
    } catch (error) {
      console.error('Error fetching eligibility history:', error);
      return ApiErrors.internalError();
    }
  }

  /**
   * Refresh eligibility (re-check with insurance)
   */
  static async refreshEligibility(
    patientId: string,
    planId: string,
    userId: string,
    ipAddress?: string | null
  ) {
    try {
      // Force re-check with insurance
      return this.checkEligibility(patientId, planId, userId, ipAddress);
    } catch (error) {
      console.error('Error refreshing eligibility:', error);
      return ApiErrors.internalError();
    }
  }

  // ============================================
  // Helper Methods
  // ============================================

  private static async queryInsuranceEligibility(
    patientId: string,
    planId: string
  ): Promise<any> {
    // TODO: Call clearinghouse/EDI 270 (eligibility inquiry)
    // This would typically call:
    // - A clearinghouse API (e.g., 270care, TTEC, Multispeed)
    // - Or your insurance provider's API
    // - Or a test/mock system

    return {
      isEligible: true,
      effectiveDate: new Date(),
      copay: 25,
      deductible: 1000,
      deductibleMet: 300,
      outOfPocketMax: 6000,
      outOfPocketMet: 500,
      requiresAuth: false,
      limitations: null,
    };
  }

  private static isServiceTypeRequiringAuth(serviceType: string): boolean {
    // Service types requiring pre-authorization
    const authRequiredTypes = [
      'surgery',
      'hospitalization',
      'specialist_referral',
      'advanced_imaging',
      'mental_health',
    ];

    return authRequiredTypes.some(type => serviceType.toLowerCase().includes(type));
  }

  private static async saveEligibilityCheckToDatabase(
    data: z.infer<typeof EligibilityCheckSchema>
  ): Promise<EligibilityCheck> {
    // TODO: Save to database
    return {
      id: `elig_${Date.now()}`,
      ...data,
    };
  }

  private static async fetchLatestEligibilityCheck(
    patientId: string,
    planId: string
  ): Promise<EligibilityCheck | null> {
    // TODO: Query database for most recent check
    return null;
  }

  private static async fetchEligibilityCheckHistoryFromDatabase(
    patientId: string,
    planId: string,
    limit: number
  ): Promise<EligibilityCheck[]> {
    // TODO: Query database with limit
    return [];
  }
}
