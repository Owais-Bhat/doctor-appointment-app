/**
 * Insurance Service
 *
 * Manages patient insurance plans, verification, and eligibility checking
 * Handles multiple insurance plans per patient with primary/secondary coverage
 */

import { InsurancePlan, InsurancePlanSchema, EligibilityCheckSchema } from '@/lib/validations';
import { logAudit, AuditAction } from '@/lib/audit/logger';
import { errorResponse, ApiErrors } from '@/lib/api/response';
import { z } from 'zod';

export class InsuranceService {
  /**
   * Add insurance plan for patient
   */
  static async addInsurancePlan(
    patientId: string,
    data: z.infer<typeof InsurancePlanSchema>,
    userId: string,
    ipAddress?: string | null
  ) {
    try {
      const validated = InsurancePlanSchema.parse({ ...data, patientId });

      // If marking as primary, demote existing primary
      if (validated.isPrimary) {
        await this.demotePrimaryPlans(patientId);
      }

      const plan = await this.saveInsurancePlanToDatabase(validated);

      await logAudit(
        userId,
        AuditAction.INSURANCE_PLAN_ADDED,
        'INSURANCE_PLAN',
        plan.id,
        {
          ipAddress,
          details: {
            patientId,
            company: validated.insuranceCompany,
            planType: validated.planType,
          },
        }
      );

      return { status: 201, body: { success: true, data: plan } };
    } catch (error) {
      console.error('Error adding insurance plan:', error);
      return ApiErrors.internalError('Failed to add insurance plan');
    }
  }

  /**
   * Get patient's insurance plans
   */
  static async getPatientInsurancePlans(patientId: string, userId: string) {
    try {
      const plans = await this.fetchPatientPlansFromDatabase(patientId);

      await logAudit(
        userId,
        AuditAction.DATA_ACCESSED,
        'INSURANCE_PLAN',
        null,
        { details: { resource: 'patient_insurance_plans', patientId } }
      );

      return { status: 200, body: { success: true, data: plans } };
    } catch (error) {
      console.error('Error fetching insurance plans:', error);
      return ApiErrors.internalError();
    }
  }

  /**
   * Get primary insurance plan for patient
   */
  static async getPrimaryInsurancePlan(patientId: string) {
    try {
      const plan = await this.fetchPrimaryPlanFromDatabase(patientId);

      if (!plan) {
        return { status: 200, body: { success: true, data: null } };
      }

      return { status: 200, body: { success: true, data: plan } };
    } catch (error) {
      console.error('Error fetching primary plan:', error);
      return ApiErrors.internalError();
    }
  }

  /**
   * Update insurance plan
   */
  static async updateInsurancePlan(
    planId: string,
    data: Partial<z.infer<typeof InsurancePlanSchema>>,
    userId: string,
    ipAddress?: string | null
  ) {
    try {
      const plan = await this.fetchPlanFromDatabase(planId);
      if (!plan) {
        return ApiErrors.notFound('Insurance plan');
      }

      const validated = InsurancePlanSchema.partial().parse(data);

      // Handle primary status change
      if (validated.isPrimary && !plan.isPrimary) {
        await this.demotePrimaryPlans(plan.patientId);
      }

      const updated = await this.updatePlanInDatabase(planId, validated);

      await logAudit(
        userId,
        AuditAction.INSURANCE_PLAN_UPDATED,
        'INSURANCE_PLAN',
        planId,
        {
          ipAddress,
          details: validated,
        }
      );

      return { status: 200, body: { success: true, data: updated } };
    } catch (error) {
      console.error('Error updating insurance plan:', error);
      return ApiErrors.internalError();
    }
  }

  /**
   * Remove insurance plan
   */
  static async removeInsurancePlan(
    planId: string,
    userId: string,
    ipAddress?: string | null
  ) {
    try {
      const plan = await this.fetchPlanFromDatabase(planId);
      if (!plan) {
        return ApiErrors.notFound('Insurance plan');
      }

      await this.deletePlanFromDatabase(planId);

      await logAudit(
        userId,
        AuditAction.INSURANCE_PLAN_REMOVED,
        'INSURANCE_PLAN',
        planId,
        { ipAddress }
      );

      return { status: 200, body: { success: true, data: { removed: true } } };
    } catch (error) {
      console.error('Error removing insurance plan:', error);
      return ApiErrors.internalError();
    }
  }

  /**
   * Verify insurance coverage
   */
  static async verifyInsuranceCoverage(
    patientId: string,
    planId: string,
    userId: string
  ) {
    try {
      const plan = await this.fetchPlanFromDatabase(planId);
      if (!plan) {
        return ApiErrors.notFound('Insurance plan');
      }

      if (plan.patientId !== patientId) {
        return ApiErrors.forbidden();
      }

      // Check if active and within dates
      const now = new Date();
      if (plan.status !== 'active' || plan.effectiveDate > now ||
          (plan.terminationDate && plan.terminationDate < now)) {
        return {
          status: 200,
          body: { success: true, data: { isActive: false, reason: 'Coverage inactive or expired' } }
        };
      }

      await logAudit(
        userId,
        AuditAction.INSURANCE_VERIFIED,
        'INSURANCE_PLAN',
        planId,
        { details: { patientId } }
      );

      return { status: 200, body: { success: true, data: { isActive: true, plan } } };
    } catch (error) {
      console.error('Error verifying insurance:', error);
      return ApiErrors.internalError();
    }
  }

  // ============================================
  // Helper Methods
  // ============================================

  private static async saveInsurancePlanToDatabase(
    data: z.infer<typeof InsurancePlanSchema>
  ): Promise<InsurancePlan> {
    // TODO: Save to database
    return {
      id: `plan_${Date.now()}`,
      ...data,
      createdAt: new Date(),
    };
  }

  private static async fetchPatientPlansFromDatabase(patientId: string): Promise<InsurancePlan[]> {
    // TODO: Query database
    return [];
  }

  private static async fetchPrimaryPlanFromDatabase(patientId: string): Promise<InsurancePlan | null> {
    // TODO: Query database for primary plan
    return null;
  }

  private static async fetchPlanFromDatabase(planId: string): Promise<InsurancePlan | null> {
    // TODO: Query database
    return null;
  }

  private static async updatePlanInDatabase(
    planId: string,
    data: Partial<InsurancePlan>
  ): Promise<InsurancePlan> {
    // TODO: Update in database
    return { id: planId, ...data } as InsurancePlan;
  }

  private static async deletePlanFromDatabase(planId: string): Promise<void> {
    // TODO: Delete from database
  }

  private static async demotePrimaryPlans(patientId: string): Promise<void> {
    // TODO: Set all other plans to non-primary
  }
}
