/**
 * Video Consultation Service
 *
 * Manages video consultations, meeting rooms, and session tokens
 * Integrates with WebRTC and video conferencing providers
 */

import { VideoConsultation } from '@/lib/validations';
import { logAudit, AuditAction } from '@/lib/audit/logger';

interface StoredConsultation {
  id: string;
  appointmentId: string;
  organizationId: string;
  clinicId: string;
  doctorId: string;
  patientId: string;
  roomId: string;
  sessionToken: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  recordingUrl?: string;
  isRecorded: boolean;
  meetingLink: string;
  joinedAt?: Date;
  leftAt?: Date;
  notes?: string;
  createdAt: Date;
}

const consultations = new Map<string, StoredConsultation>();
const activeRooms = new Map<string, Set<string>>();

export class VideoConsultationService {
  /**
   * Schedule video consultation
   */
  static async scheduleConsultation(
    appointmentId: string,
    organizationId: string,
    clinicId: string,
    doctorId: string,
    patientId: string,
    startTime: Date,
    shouldRecord: boolean = false
  ): Promise<StoredConsultation> {
    const consultationId = `vc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const roomId = this.generateRoomId();
    const sessionToken = this.generateSessionToken();
    const meetingLink = `https://videoconsult.example.com/${roomId}`;

    const consultation: StoredConsultation = {
      id: consultationId,
      appointmentId,
      organizationId,
      clinicId,
      doctorId,
      patientId,
      roomId,
      sessionToken,
      status: 'scheduled',
      startTime,
      isRecorded: shouldRecord,
      meetingLink,
      createdAt: new Date(),
    };

    consultations.set(consultationId, consultation);

    await logAudit(doctorId, AuditAction.DASHBOARD_ACCESSED, 'VIDEO_CONSULTATION', consultationId, {
      status: 'SUCCESS',
      details: { appointmentId, patientId, shouldRecord },
    });

    return consultation;
  }

  /**
   * Get consultation details
   */
  static async getConsultation(consultationId: string): Promise<StoredConsultation | null> {
    return consultations.get(consultationId) || null;
  }

  /**
   * Get consultation by appointment
   */
  static async getConsultationByAppointment(appointmentId: string): Promise<StoredConsultation | null> {
    for (const consultation of consultations.values()) {
      if (consultation.appointmentId === appointmentId) {
        return consultation;
      }
    }
    return null;
  }

  /**
   * Start video consultation (doctor or patient joins)
   */
  static async startConsultation(consultationId: string, userId: string): Promise<void> {
    const consultation = consultations.get(consultationId);

    if (!consultation) {
      throw new Error('Consultation not found');
    }

    if (consultation.status === 'scheduled') {
      consultation.status = 'in_progress';
      consultation.joinedAt = new Date();

      if (!activeRooms.has(consultation.roomId)) {
        activeRooms.set(consultation.roomId, new Set());
      }
      activeRooms.get(consultation.roomId)!.add(userId);

      await logAudit(userId, AuditAction.DASHBOARD_ACCESSED, 'VIDEO_CONSULTATION', consultationId, {
        status: 'SUCCESS',
        details: { action: 'joined' },
      });
    }
  }

  /**
   * End video consultation
   */
  static async endConsultation(
    consultationId: string,
    userId: string,
    notes?: string
  ): Promise<void> {
    const consultation = consultations.get(consultationId);

    if (!consultation) {
      throw new Error('Consultation not found');
    }

    if (consultation.status === 'in_progress') {
      consultation.status = 'completed';
      consultation.endTime = new Date();
      consultation.duration = Math.floor(
        (consultation.endTime.getTime() - consultation.startTime.getTime()) / 1000 / 60
      );

      if (notes) {
        consultation.notes = notes;
      }

      const room = activeRooms.get(consultation.roomId);
      if (room) {
        room.delete(userId);
        if (room.size === 0) {
          activeRooms.delete(consultation.roomId);
        }
      }

      await logAudit(userId, AuditAction.DASHBOARD_ACCESSED, 'VIDEO_CONSULTATION', consultationId, {
        status: 'SUCCESS',
        details: { action: 'ended', duration: consultation.duration },
      });
    }
  }

  /**
   * Get active consultations for clinic
   */
  static async getActiveConsultations(clinicId: string): Promise<StoredConsultation[]> {
    return Array.from(consultations.values())
      .filter((c) => c.clinicId === clinicId && c.status === 'in_progress');
  }

  /**
   * Get doctor's consultation history
   */
  static async getDoctorConsultationHistory(
    doctorId: string,
    limit: number = 50
  ): Promise<StoredConsultation[]> {
    return Array.from(consultations.values())
      .filter((c) => c.doctorId === doctorId && c.status !== 'scheduled')
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, limit);
  }

  /**
   * Get patient's consultation history
   */
  static async getPatientConsultationHistory(
    patientId: string,
    limit: number = 50
  ): Promise<StoredConsultation[]> {
    return Array.from(consultations.values())
      .filter((c) => c.patientId === patientId && c.status !== 'scheduled')
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, limit);
  }

  /**
   * Cancel consultation
   */
  static async cancelConsultation(consultationId: string, reason?: string): Promise<void> {
    const consultation = consultations.get(consultationId);

    if (!consultation) {
      throw new Error('Consultation not found');
    }

    consultation.status = 'cancelled';

    await logAudit(null, AuditAction.APPOINTMENT_CANCELLED, 'VIDEO_CONSULTATION', consultationId, {
      status: 'SUCCESS',
      details: { reason },
    });
  }

  /**
   * Mark no-show
   */
  static async markNoShow(consultationId: string): Promise<void> {
    const consultation = consultations.get(consultationId);

    if (!consultation) {
      throw new Error('Consultation not found');
    }

    consultation.status = 'no_show';
    consultation.endTime = new Date();

    await logAudit(null, AuditAction.APPOINTMENT_CANCELLED, 'VIDEO_CONSULTATION', consultationId, {
      status: 'SUCCESS',
      details: { action: 'no_show' },
    });
  }

  /**
   * Add recording
   */
  static async addRecording(
    consultationId: string,
    recordingUrl: string
  ): Promise<void> {
    const consultation = consultations.get(consultationId);

    if (!consultation) {
      throw new Error('Consultation not found');
    }

    consultation.recordingUrl = recordingUrl;

    await logAudit(null, AuditAction.REPORT_EXPORTED, 'VIDEO_CONSULTATION', consultationId, {
      status: 'SUCCESS',
      details: { recordingUrl },
    });
  }

  /**
   * Get participants in room
   */
  static async getRoomParticipants(roomId: string): Promise<string[]> {
    const participants = activeRooms.get(roomId);
    return participants ? Array.from(participants) : [];
  }

  /**
   * Generate meeting statistics
   */
  static async getConsultationStats(organizationId: string, period: string = 'month'): Promise<{
    totalConsultations: number;
    completedConsultations: number;
    cancelledConsultations: number;
    noShowRate: number;
    averageDuration: number;
    recordedPercentage: number;
  }> {
    const periodStart = this.getPeriodStart(period);
    const filtered = Array.from(consultations.values()).filter(
      (c) => c.organizationId === organizationId && c.createdAt >= periodStart
    );

    const completed = filtered.filter((c) => c.status === 'completed');
    const cancelled = filtered.filter((c) => c.status === 'cancelled');
    const noShow = filtered.filter((c) => c.status === 'no_show');
    const recorded = filtered.filter((c) => c.recordingUrl);

    const totalDuration = completed.reduce((sum, c) => sum + (c.duration || 0), 0);

    return {
      totalConsultations: filtered.length,
      completedConsultations: completed.length,
      cancelledConsultations: cancelled.length,
      noShowRate: filtered.length > 0 ? (noShow.length / filtered.length) * 100 : 0,
      averageDuration: completed.length > 0 ? totalDuration / completed.length : 0,
      recordedPercentage: filtered.length > 0 ? (recorded.length / filtered.length) * 100 : 0,
    };
  }

  /**
   * Generate room ID
   */
  private static generateRoomId(): string {
    return `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate session token
   */
  private static generateSessionToken(): string {
    return `token_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }

  /**
   * Get period start date
   */
  private static getPeriodStart(period: string): Date {
    const now = new Date();
    const date = new Date(now);

    switch (period) {
      case 'day':
        date.setDate(date.getDate() - 1);
        break;
      case 'week':
        date.setDate(date.getDate() - 7);
        break;
      case 'month':
        date.setMonth(date.getMonth() - 1);
        break;
      case 'quarter':
        date.setMonth(date.getMonth() - 3);
        break;
      case 'year':
        date.setFullYear(date.getFullYear() - 1);
        break;
    }

    return date;
  }
}
