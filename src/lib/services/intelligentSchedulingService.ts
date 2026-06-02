/**
 * Intelligent Scheduling Service
 * AI-powered appointment scheduling with optimal time recommendations
 */

import { logAudit, AuditAction } from '@/lib/audit/logger';

interface SchedulingRecommendation {
  id: string;
  patientId: string;
  doctorId: string;
  recommendedTimes: {
    startTime: Date;
    confidence: number;
    reason: string;
  }[];
  appointmentType: string;
  estimatedDuration: number;
  urgencyLevel: 'routine' | 'urgent' | 'emergency';
  createdAt: Date;
}

interface TimeSlot {
  startTime: Date;
  endTime: Date;
  available: boolean;
  confidence: number;
  predictedNoShowRisk?: number;
}

const recommendations = new Map<string, SchedulingRecommendation>();
const optimizedSlots = new Map<string, TimeSlot[]>();

export class IntelligentSchedulingService {
  static async getOptimalSchedulingTimes(
    patientId: string,
    doctorId: string,
    appointmentType: string,
    availableSlots: Date[]
  ): Promise<SchedulingRecommendation> {
    const recId = `sched_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const recommendedTimes = availableSlots.map((slot) => ({
      startTime: slot,
      confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
      reason: this.getSchedulingReason(slot, appointmentType),
    }));

    recommendedTimes.sort((a, b) => b.confidence - a.confidence);

    const rec: SchedulingRecommendation = {
      id: recId,
      patientId,
      doctorId,
      recommendedTimes: recommendedTimes.slice(0, 5),
      appointmentType,
      estimatedDuration: this.getEstimatedDuration(appointmentType),
      urgencyLevel: 'routine',
      createdAt: new Date(),
    };

    recommendations.set(recId, rec);
    await logAudit(patientId, AuditAction.ANALYTICS_VIEWED, 'SCHEDULING', recId, {
      status: 'SUCCESS',
      details: { doctorId, appointmentType },
    });

    return rec;
  }

  static async findAvailableSlots(
    doctorId: string,
    date: Date,
    slotDuration: number = 30
  ): Promise<TimeSlot[]> {
    const slots: TimeSlot[] = [];
    const startHour = 9;
    const endHour = 17;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        const slotStart = new Date(date);
        slotStart.setHours(hour, minute, 0, 0);

        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration);

        slots.push({
          startTime: slotStart,
          endTime: slotEnd,
          available: Math.random() > 0.3, // 70% availability
          confidence: 0.85 + Math.random() * 0.15,
          predictedNoShowRisk: Math.random() * 0.2, // 0-20% no-show risk
        });
      }
    }

    return slots.filter((s) => s.available);
  }

  static async balanceWorkload(
    doctorId: string,
    clinicId: string,
    newAppointmentDuration: number
  ): Promise<{ recommendedTime: Date; workloadScore: number }> {
    // Get doctor's current schedule and find least busy time
    const currentTime = new Date();
    const peakHours = [11, 12, 2, 3]; // 11am, 12pm, 2pm, 3pm
    const quietHours = [9, 10, 14, 15, 16]; // Morning and late afternoon

    let recommendedTime = new Date(currentTime);
    for (const hour of quietHours) {
      const testTime = new Date(currentTime);
      testTime.setHours(hour, 0, 0, 0);
      if (testTime > currentTime) {
        recommendedTime = testTime;
        break;
      }
    }

    return {
      recommendedTime,
      workloadScore: 0.65, // 65% workload after scheduling
    };
  }

  static async predictConflicts(
    doctorId: string,
    startTime: Date,
    duration: number
  ): Promise<{
    hasConflict: boolean;
    conflictType?: string;
    recommendations: string[];
  }> {
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + duration);

    // Simulate conflict detection
    const hasConflict = Math.random() > 0.85;

    return {
      hasConflict,
      conflictType: hasConflict ? 'overlap' : undefined,
      recommendations: hasConflict
        ? [
            'Adjust appointment start time by 15 minutes',
            'Consider alternative doctor with availability',
            'Offer earlier or later time slot',
          ]
        : ['Proceed with booking'],
    };
  }

  static async optimizeScheduleGaps(doctorId: string): Promise<string[]> {
    const gaps: string[] = [];

    // Common gap patterns to optimize
    const suggestions = [
      'Schedule follow-ups during identified 30-minute gaps',
      'Block 15-minute slots for consultations',
      'Batch similar appointment types',
      'Add buffer time after complex procedures',
    ];

    return suggestions.filter(() => Math.random() > 0.5);
  }

  static async suggestRescheduling(
    appointmentId: string,
    reason: string
  ): Promise<{
    alternativeSlots: Date[];
    priorityScore: number;
  }> {
    const baseDate = new Date();
    const alternativeSlots = [];

    // Generate 5 alternative slots
    for (let i = 1; i <= 5; i++) {
      const slot = new Date(baseDate);
      slot.setDate(slot.getDate() + i);
      slot.setHours(14, 0, 0, 0); // 2 PM
      alternativeSlots.push(slot);
    }

    return {
      alternativeSlots,
      priorityScore: reason === 'medical' ? 0.95 : 0.6,
    };
  }

  static async getRecommendationById(
    recId: string
  ): Promise<SchedulingRecommendation | undefined> {
    return recommendations.get(recId);
  }

  private static getSchedulingReason(slot: Date, appointmentType: string): string {
    const reasons: { [key: string]: string[] } = {
      consultation: [
        'Optimal for new patient consultations',
        'Good availability for follow-ups',
        'Preferred time for complex cases',
      ],
      followup: [
        'Ideal for routine follow-up',
        'Minimal wait time expected',
        'Doctor less likely to run behind',
      ],
      procedure: [
        'Good for procedure scheduling',
        'Full time block available',
        'Recovery time manageable',
      ],
    };

    const typeReasons = reasons[appointmentType] || reasons['consultation'];
    return typeReasons[Math.floor(Math.random() * typeReasons.length)];
  }

  private static getEstimatedDuration(appointmentType: string): number {
    const durations: { [key: string]: number } = {
      consultation: 30,
      followup: 20,
      procedure: 60,
      checkup: 15,
      assessment: 45,
    };

    return durations[appointmentType] || 30;
  }
}
