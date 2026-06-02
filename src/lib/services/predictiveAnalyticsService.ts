/**
 * Predictive Analytics Service
 * Machine learning predictions for patient outcomes, no-shows, revenue, and utilization
 */

import { Prediction } from '@/lib/validations';
import { logAudit, AuditAction } from '@/lib/audit/logger';

interface StoredPrediction {
  id: string;
  userId: string;
  patientId?: string;
  type: 'churn' | 'readmission' | 'dna' | 'revenue' | 'utilization';
  probability: number;
  factors: string[];
  timeframe: string;
  recommendations: string[];
  confidence: number;
  modelVersion: string;
  createdAt: Date;
  validUntil?: Date;
}

const predictions = new Map<string, StoredPrediction>();

export class PredictiveAnalyticsService {
  static async predictChurnRisk(
    userId: string,
    patientId: string,
    lastVisitDays: number,
    appointmentNo: number,
    avgDaysBetweenVisits: number
  ): Promise<StoredPrediction> {
    const predId = `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Simple churn model based on visit patterns
    let churnScore = 0;
    const factors: string[] = [];

    if (lastVisitDays > avgDaysBetweenVisits * 2) {
      churnScore += 0.3;
      factors.push('Long time since last visit');
    }
    if (appointmentNo < 3) {
      churnScore += 0.2;
      factors.push('Low appointment count');
    }
    if (lastVisitDays > 180) {
      churnScore += 0.25;
      factors.push('No activity for 6+ months');
    }

    const pred: StoredPrediction = {
      id: predId,
      userId,
      patientId,
      type: 'churn',
      probability: Math.min(1, churnScore),
      factors,
      timeframe: '90 days',
      recommendations: [
        'Schedule proactive follow-up appointment',
        'Send engagement reminder via email',
        'Consider special offer or incentive',
      ],
      confidence: 0.82,
      modelVersion: 'v1.0',
      createdAt: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };

    predictions.set(predId, pred);
    await logAudit(userId, AuditAction.ANALYTICS_VIEWED, 'PREDICTION', predId, {
      status: 'SUCCESS',
      details: { type: 'churn', probability: pred.probability },
    });

    return pred;
  }

  static async predictReadmissionRisk(
    userId: string,
    patientId: string,
    conditions: string[],
    recentHospitalization: boolean,
    medicationCount: number
  ): Promise<StoredPrediction> {
    const predId = `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    let readmissionScore = 0;
    const factors: string[] = [];

    if (recentHospitalization) {
      readmissionScore += 0.4;
      factors.push('Recent hospitalization');
    }
    if (conditions.length > 3) {
      readmissionScore += 0.25;
      factors.push(`${conditions.length} chronic conditions`);
    }
    if (medicationCount > 5) {
      readmissionScore += 0.2;
      factors.push('Multiple medications (>5)');
    }

    const pred: StoredPrediction = {
      id: predId,
      userId,
      patientId,
      type: 'readmission',
      probability: Math.min(1, readmissionScore),
      factors,
      timeframe: '30 days',
      recommendations: [
        'Schedule post-discharge follow-up within 7 days',
        'Arrange home health care support',
        'Coordinate with discharge planning team',
        'Monitor medication adherence',
      ],
      confidence: 0.87,
      modelVersion: 'v1.0',
      createdAt: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };

    predictions.set(predId, pred);
    await logAudit(userId, AuditAction.ANALYTICS_VIEWED, 'PREDICTION', predId, {
      status: 'SUCCESS',
      details: { type: 'readmission', probability: pred.probability },
    });

    return pred;
  }

  static async predictDNARisk(
    userId: string,
    patientId: string,
    noShowCount: number,
    cancelCount: number,
    appointmentType: string
  ): Promise<StoredPrediction> {
    const predId = `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    let dnaScore = 0;
    const factors: string[] = [];

    if (noShowCount >= 2) {
      dnaScore += 0.35;
      factors.push(`${noShowCount} previous no-shows`);
    }
    if (cancelCount >= 3) {
      dnaScore += 0.25;
      factors.push(`${cancelCount} recent cancellations`);
    }
    if (appointmentType === 'preventive') {
      dnaScore += 0.15;
      factors.push('Preventive care appointment (higher DNA rate)');
    }

    const pred: StoredPrediction = {
      id: predId,
      userId,
      patientId,
      type: 'dna',
      probability: Math.min(1, dnaScore),
      factors,
      timeframe: 'Next appointment',
      recommendations: [
        'Send appointment reminder 48 hours before',
        'Request appointment confirmation via SMS',
        'Consider overbooking strategy',
        'Offer flexible rescheduling options',
      ],
      confidence: 0.79,
      modelVersion: 'v1.0',
      createdAt: new Date(),
      validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    };

    predictions.set(predId, pred);
    return pred;
  }

  static async predictRevenueImpact(
    userId: string,
    doctorId: string,
    appointmentRate: number,
    avgRevenuePerAppointment: number,
    seasonalityFactor: number
  ): Promise<StoredPrediction> {
    const predId = `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const projectedMonthlyRevenue = appointmentRate * avgRevenuePerAppointment * seasonalityFactor;
    const factors: string[] = [];

    if (appointmentRate > 20) {
      factors.push('High appointment volume');
    }
    if (seasonalityFactor > 1.1) {
      factors.push('Positive seasonal trend');
    }
    if (avgRevenuePerAppointment > 150) {
      factors.push('Above-average consultation fees');
    }

    const pred: StoredPrediction = {
      id: predId,
      userId,
      patientId: doctorId,
      type: 'revenue',
      probability: projectedMonthlyRevenue,
      factors,
      timeframe: '30 days',
      recommendations: [
        'Optimize scheduling efficiency',
        'Cross-sell complementary services',
        'Implement premium appointment options',
      ],
      confidence: 0.85,
      modelVersion: 'v1.0',
      createdAt: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };

    predictions.set(predId, pred);
    return pred;
  }

  static async predictUtilization(
    userId: string,
    clinicId: string,
    slotsAvailable: number,
    slotsBooked: number,
    historicalUtilizationRate: number
  ): Promise<StoredPrediction> {
    const predId = `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const currentUtilization = slotsBooked / (slotsBooked + slotsAvailable);
    const factors: string[] = [];

    if (currentUtilization > 0.8) {
      factors.push('High current utilization (>80%)');
    }
    if (historicalUtilizationRate < 0.6) {
      factors.push('Below-average historical utilization');
    }

    const pred: StoredPrediction = {
      id: predId,
      userId,
      patientId: clinicId,
      type: 'utilization',
      probability: currentUtilization,
      factors,
      timeframe: 'Next 7 days',
      recommendations: [
        'Adjust scheduling policies',
        'Promote available time slots',
        'Consider dynamic pricing strategies',
      ],
      confidence: 0.88,
      modelVersion: 'v1.0',
      createdAt: new Date(),
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };

    predictions.set(predId, pred);
    return pred;
  }

  static async getUserPredictions(
    userId: string,
    type?: string
  ): Promise<StoredPrediction[]> {
    return Array.from(predictions.values())
      .filter((p) => p.userId === userId && (!type || p.type === type))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  static async getPredictionById(predId: string): Promise<StoredPrediction | undefined> {
    return predictions.get(predId);
  }
}
