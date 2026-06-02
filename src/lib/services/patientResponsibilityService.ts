/**
 * Patient Responsibility Service
 *
 * Calculates patient's out-of-pocket costs (copay, deductible, coinsurance)
 * Provides cost estimates before and actuals after treatment
 */

import { PatientResponsibility, PatientResponsibilitySchema } from '@/lib/validations';
import { logAudit, AuditAction } from '@/lib/audit/logger';
import { ApiErrors } from '@/lib/api/response';
import { z } from 'zod';

export class PatientResponsibilityService {
  /**
   * Estimate patient responsibility before appointment
   */
  static async estimateResponsibility(
    appointmentId: string,
    patientId: string,
    planId: string,
    serviceCharges: number,
    userId: string
  ) {
    try {
      // Get patient's benefits
      const benefits = await this.getPatientBenefits(planId);

      // Calculate estimated costs
      const estimate = this.calculateResponsibility(
        serviceCharges,
        benefits,
        true // is estimate
      );

      const responsibility = await this.saveResponsibilityToDatabase({
        patientId,
        appointmentId,
        estimatedCopay: estimate.copay,
        estimatedDeductible: estimate.deductible,
        estimatedCoinsurance: estimate.coinsurance,
        estimatedTotal: estimate.total,
        status: 'estimated',
      });

      await logAudit(
        userId,
        AuditAction.COST_ESTIMATED,
        'PATIENT_RESPONSIBILITY',
        responsibility.id,
        {
          details: {
            appointmentId,
            patientId,
            estimatedTotal: estimate.total,
          },
        }
      );

      return { status: 200, body: { success: true, data: responsibility } };
    } catch (error) {
      console.error('Error estimating responsibility:', error);
      return ApiErrors.internalError('Failed to estimate costs');
    }
  }

  /**
   * Finalize patient responsibility after service
   */
  static async finalizeResponsibility(
    appointmentId: string,
    patientId: string,
    actualCharges: number,
    actualAllowedAmount: number,
    userId: string,
    ipAddress?: string | null
  ) {
    try {
      // Get patient's insurance plan
      const plan = await this.getPatientPrimaryPlan(patientId);
      if (!plan) {
        return ApiErrors.notFound('Insurance plan');
      }

      // Get current plan benefits/deductible status
      const benefits = await this.getPatientBenefits(plan.id);

      // Calculate actual patient responsibility
      const actual = this.calculateResponsibility(
        actualCharges,
        benefits,
        false, // is actual
        actualAllowedAmount
      );

      // Find or create responsibility record
      let responsibility = await this.fetchResponsibilityByAppointment(appointmentId);

      if (responsibility) {
        // Update with actual amounts
        responsibility = await this.updateResponsibilityInDatabase(responsibility.id, {
          actualCopay: actual.copay,
          actualDeductible: actual.deductible,
          actualCoinsurance: actual.coinsurance,
          actualTotal: actual.total,
          status: 'finalized',
          finalizedAt: new Date(),
        });
      } else {
        // Create new responsibility record
        responsibility = await this.saveResponsibilityToDatabase({
          patientId,
          appointmentId,
          estimatedCopay: actual.copay,
          estimatedDeductible: actual.deductible,
          estimatedCoinsurance: actual.coinsurance,
          estimatedTotal: actual.total,
          actualCopay: actual.copay,
          actualDeductible: actual.deductible,
          actualCoinsurance: actual.coinsurance,
          actualTotal: actual.total,
          status: 'finalized',
        });
      }

      await logAudit(
        userId,
        AuditAction.COST_FINALIZED,
        'PATIENT_RESPONSIBILITY',
        responsibility.id,
        {
          ipAddress,
          details: {
            appointmentId,
            actualTotal: actual.total,
            actualCharges,
          },
        }
      );

      return { status: 200, body: { success: true, data: responsibility } };
    } catch (error) {
      console.error('Error finalizing responsibility:', error);
      return ApiErrors.internalError('Failed to finalize costs');
    }
  }

  /**
   * Get patient responsibility summary
   */
  static async getResponsibilitySummary(patientId: string, userId: string) {
    try {
      const responsibilities = await this.fetchPatientResponsibilitiesFromDatabase(patientId);

      const summary = {
        totalEstimated: responsibilities.reduce((sum, r) => sum + (r.estimatedTotal || 0), 0),
        totalActual: responsibilities.reduce((sum, r) => sum + (r.actualTotal || 0), 0),
        totalPaid: responsibilities.reduce((sum, r) => sum + (r.amountPaid || 0), 0),
        totalOutstanding: 0,
        appointments: responsibilities,
      };

      summary.totalOutstanding = summary.totalActual - summary.totalPaid;

      await logAudit(
        userId,
        AuditAction.DATA_ACCESSED,
        'PATIENT_RESPONSIBILITY',
        null,
        { details: { resource: 'responsibility_summary', patientId } }
      );

      return { status: 200, body: { success: true, data: summary } };
    } catch (error) {
      console.error('Error getting responsibility summary:', error);
      return ApiErrors.internalError();
    }
  }

  /**
   * Record patient payment toward responsibility
   */
  static async recordPayment(
    responsibilityId: string,
    amountPaid: number,
    userId: string,
    ipAddress?: string | null
  ) {
    try {
      const responsibility = await this.fetchResponsibilityFromDatabase(responsibilityId);
      if (!responsibility) {
        return ApiErrors.notFound('Patient responsibility');
      }

      const newAmountPaid = (responsibility.amountPaid || 0) + amountPaid;
      const status = newAmountPaid >= (responsibility.actualTotal || 0) ? 'paid' : 'outstanding';

      const updated = await this.updateResponsibilityInDatabase(responsibilityId, {
        amountPaid: newAmountPaid,
        status,
      });

      await logAudit(
        userId,
        AuditAction.PAYMENT_RECORDED,
        'PATIENT_RESPONSIBILITY',
        responsibilityId,
        {
          ipAddress,
          details: { amountPaid },
        }
      );

      return { status: 200, body: { success: true, data: updated } };
    } catch (error) {
      console.error('Error recording payment:', error);
      return ApiErrors.internalError();
    }
  }

  /**
   * Get outstanding balances
   */
  static async getOutstandingBalances(patientId: string) {
    try {
      const outstanding = await this.fetchOutstandingBalancesFromDatabase(patientId);

      return { status: 200, body: { success: true, data: outstanding } };
    } catch (error) {
      console.error('Error fetching outstanding balances:', error);
      return ApiErrors.internalError();
    }
  }

  // ============================================
  // Helper Methods
  // ============================================

  private static calculateResponsibility(
    chargeAmount: number,
    benefits: any,
    isEstimate: boolean = true,
    allowedAmount?: number
  ): { copay: number; deductible: number; coinsurance: number; total: number } {
    const amount = allowedAmount || chargeAmount;

    let copay = benefits.copay || 0;
    let deductible = 0;
    let coinsurance = 0;

    // Calculate deductible portion
    const deductibleRemaining = Math.max(0, (benefits.deductible || 0) - (benefits.deductibleMet || 0));
    deductible = Math.min(amount - copay, deductibleRemaining);

    // Calculate coinsurance (after deductible)
    const coinsuranceRate = (benefits.coinsurancePercentage || 20) / 100;
    const amountAfterDeductible = amount - copay - deductible;
    coinsurance = amountAfterDeductible * coinsuranceRate;

    // Cap at out-of-pocket max
    const oopRemaining = Math.max(
      0,
      (benefits.outOfPocketMax || 0) - (benefits.outOfPocketMet || 0)
    );
    const totalBeforeCap = copay + deductible + coinsurance;
    const total = Math.min(totalBeforeCap, oopRemaining);

    return {
      copay,
      deductible,
      coinsurance,
      total,
    };
  }

  private static async getPatientBenefits(planId: string): Promise<any> {
    // TODO: Get current plan benefits and deductible status
    return {
      copay: 25,
      deductible: 1000,
      deductibleMet: 300,
      outOfPocketMax: 6000,
      outOfPocketMet: 500,
      coinsurancePercentage: 20,
    };
  }

  private static async getPatientPrimaryPlan(patientId: string): Promise<any> {
    // TODO: Query database for primary insurance plan
    return null;
  }

  private static async saveResponsibilityToDatabase(
    data: Partial<PatientResponsibility>
  ): Promise<PatientResponsibility> {
    // TODO: Save to database
    return {
      id: `resp_${Date.now()}`,
      patientId: data.patientId!,
      appointmentId: data.appointmentId!,
      estimatedCopay: data.estimatedCopay || 0,
      estimatedDeductible: data.estimatedDeductible || 0,
      estimatedCoinsurance: data.estimatedCoinsurance || 0,
      estimatedTotal: data.estimatedTotal || 0,
      amountPaid: 0,
      status: 'estimated',
      createdAt: new Date(),
    };
  }

  private static async fetchResponsibilityFromDatabase(
    responsibilityId: string
  ): Promise<PatientResponsibility | null> {
    // TODO: Query database
    return null;
  }

  private static async fetchResponsibilityByAppointment(
    appointmentId: string
  ): Promise<PatientResponsibility | null> {
    // TODO: Query database
    return null;
  }

  private static async fetchPatientResponsibilitiesFromDatabase(
    patientId: string
  ): Promise<PatientResponsibility[]> {
    // TODO: Query database
    return [];
  }

  private static async fetchOutstandingBalancesFromDatabase(
    patientId: string
  ): Promise<any[]> {
    // TODO: Query database for unpaid balances
    return [];
  }

  private static async updateResponsibilityInDatabase(
    responsibilityId: string,
    data: Partial<PatientResponsibility>
  ): Promise<PatientResponsibility> {
    // TODO: Update in database
    return { id: responsibilityId, ...data } as PatientResponsibility;
  }
}
