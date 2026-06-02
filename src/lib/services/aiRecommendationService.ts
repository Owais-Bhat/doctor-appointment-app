/**
 * AI Recommendation Service
 * Provides intelligent recommendations for appointments, treatments, referrals
 */

import { Recommendation } from '@/lib/validations';
import { logAudit, AuditAction } from '@/lib/audit/logger';

interface StoredRecommendation {
  id: string;
  userId: string;
  type: 'appointment' | 'treatment' | 'referral' | 'preventive' | 'lifestyle';
  title: string;
  description: string;
  confidence: number;
  reason: string;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high';
  expiresAt?: Date;
  dismissed: boolean;
  dismissedAt?: Date;
  createdAt: Date;
}

const recommendations = new Map<string, StoredRecommendation>();

export class AIRecommendationService {
  static async generateAppointmentRecommendation(
    userId: string,
    specialty: string,
    lastVisit: Date,
    confidence: number = 0.85
  ): Promise<StoredRecommendation> {
    const recId = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const daysSinceVisit = Math.floor((Date.now() - lastVisit.getTime()) / (1000 * 60 * 60 * 24));

    const rec: StoredRecommendation = {
      id: recId,
      userId,
      type: 'appointment',
      title: `Schedule ${specialty} Appointment`,
      description: `It's been ${daysSinceVisit} days since your last visit. Regular checkups help maintain your health.`,
      confidence,
      reason: `Annual checkup interval exceeded`,
      priority: daysSinceVisit > 365 ? 'high' : 'medium',
      createdAt: new Date(),
      dismissed: false,
    };

    recommendations.set(recId, rec);
    await logAudit(userId, AuditAction.ANALYTICS_VIEWED, 'RECOMMENDATION', recId, {
      status: 'SUCCESS',
      details: { type: 'appointment', specialty },
    });

    return rec;
  }

  static async generateTreatmentRecommendation(
    userId: string,
    condition: string,
    treatmentType: string,
    confidence: number = 0.75
  ): Promise<StoredRecommendation> {
    const recId = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const rec: StoredRecommendation = {
      id: recId,
      userId,
      type: 'treatment',
      title: `Recommended: ${treatmentType} for ${condition}`,
      description: `Based on clinical guidelines and your medical history, ${treatmentType} is recommended.`,
      confidence,
      reason: `Evidence-based treatment guideline`,
      priority: 'high',
      createdAt: new Date(),
      dismissed: false,
    };

    recommendations.set(recId, rec);
    await logAudit(userId, AuditAction.ANALYTICS_VIEWED, 'RECOMMENDATION', recId, {
      status: 'SUCCESS',
      details: { type: 'treatment', condition },
    });

    return rec;
  }

  static async generateReferralRecommendation(
    userId: string,
    specialty: string,
    reason: string,
    confidence: number = 0.8
  ): Promise<StoredRecommendation> {
    const recId = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const rec: StoredRecommendation = {
      id: recId,
      userId,
      type: 'referral',
      title: `Consider Referral to ${specialty}`,
      description: `A specialist consultation may help with your ${reason}.`,
      confidence,
      reason: `Clinical indication for specialist evaluation`,
      priority: 'high',
      createdAt: new Date(),
      dismissed: false,
    };

    recommendations.set(recId, rec);
    return rec;
  }

  static async getUserRecommendations(
    userId: string,
    limit: number = 10
  ): Promise<StoredRecommendation[]> {
    return Array.from(recommendations.values())
      .filter((r) => r.userId === userId && !r.dismissed)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  static async dismissRecommendation(recId: string): Promise<void> {
    const rec = recommendations.get(recId);
    if (rec) {
      rec.dismissed = true;
      rec.dismissedAt = new Date();
    }
  }

  static async getRecommendationScore(userId: string): Promise<number> {
    const recs = Array.from(recommendations.values()).filter((r) => r.userId === userId);
    const avgConfidence = recs.length > 0 ? recs.reduce((sum, r) => sum + r.confidence, 0) / recs.length : 0;
    return Math.min(1, avgConfidence);
  }
}
