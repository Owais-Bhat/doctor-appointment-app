/**
 * Consultation Service
 *
 * Business logic for video consultations
 * Handles session management, permissions, notifications
 */

import { invalidateCacheTag, CacheTags } from '@/lib/cache/cacheManager';
import { logAuditEvent, logSecurityEvent } from '@/lib/audit/logger';

/**
 * Consultation session
 */
export interface ConsultationSession {
  sessionId: string;
  appointmentId: string;
  doctorId: string;
  patientId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in seconds
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  recordingId?: string;
  consentGiven: boolean;
  notes?: string;
  prescription?: {
    medication: string;
    dosage: string;
    duration: string;
  }[];
}

/**
 * Session token
 */
export interface SessionToken {
  token: string;
  expiresAt: Date;
  sessionId: string;
  userId: string;
}

/**
 * Consultation service
 */
export class ConsultationService {
  private sessions: Map<string, ConsultationSession> = new Map();
  private sessionTokens: Map<string, SessionToken> = new Map();
  private tokenExpiration = 60 * 60 * 1000; // 1 hour

  /**
   * Create consultation session
   */
  async createSession(
    appointmentId: string,
    doctorId: string,
    patientId: string,
    recordingConsent: boolean,
    userId: string,
    ipAddress: string
  ): Promise<ConsultationSession> {
    const sessionId = `cons_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const session: ConsultationSession = {
      sessionId,
      appointmentId,
      doctorId,
      patientId,
      startTime: new Date(),
      status: 'in-progress',
      consentGiven: recordingConsent,
    };

    this.sessions.set(sessionId, session);

    // Log audit event
    await logAuditEvent({
      action: 'CONSULTATION_STARTED',
      resourceType: 'consultation',
      resourceId: sessionId,
      userId,
      ipAddress,
      details: {
        appointmentId,
        doctorId,
        patientId,
        recordingConsent,
      },
    });

    console.log(`[CONSULTATION] Session created: ${sessionId}`);

    return session;
  }

  /**
   * Get session
   */
  async getSession(sessionId: string, userId: string): Promise<ConsultationSession | null> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return null;
    }

    // Verify user is participant
    if (userId !== session.doctorId && userId !== session.patientId) {
      await logSecurityEvent({
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        resourceType: 'consultation',
        resourceId: sessionId,
        userId,
        details: { attemptedSessionId: sessionId },
      });

      throw new Error('Unauthorized access to consultation');
    }

    return session;
  }

  /**
   * End consultation session
   */
  async endSession(
    sessionId: string,
    userId: string,
    ipAddress: string,
    notes?: string
  ): Promise<ConsultationSession> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    // Verify authorization
    if (userId !== session.doctorId) {
      await logSecurityEvent({
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        resourceType: 'consultation',
        resourceId: sessionId,
        userId,
      });

      throw new Error('Only doctor can end consultation');
    }

    // Update session
    session.endTime = new Date();
    session.duration = Math.round(
      (session.endTime.getTime() - session.startTime.getTime()) / 1000
    );
    session.status = 'completed';

    if (notes) {
      session.notes = notes;
    }

    // Log event
    await logAuditEvent({
      action: 'CONSULTATION_ENDED',
      resourceType: 'consultation',
      resourceId: sessionId,
      userId,
      ipAddress,
      details: {
        duration: session.duration,
        notes,
      },
    });

    // Invalidate appointment cache
    invalidateCacheTag(CacheTags.APPOINTMENTS);

    console.log(`[CONSULTATION] Session ended: ${sessionId}`);

    return session;
  }

  /**
   * Generate session token
   */
  generateSessionToken(
    sessionId: string,
    userId: string,
    ipAddress: string
  ): SessionToken {
    const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + this.tokenExpiration);

    const sessionToken: SessionToken = {
      token,
      expiresAt,
      sessionId,
      userId,
    };

    this.sessionTokens.set(token, sessionToken);

    // Log token generation
    logAuditEvent({
      action: 'SESSION_TOKEN_GENERATED',
      resourceType: 'consultation',
      resourceId: sessionId,
      userId,
      ipAddress,
    });

    // Auto-expire token
    setTimeout(() => {
      this.sessionTokens.delete(token);
    }, this.tokenExpiration);

    console.log(`[CONSULTATION] Token generated: ${sessionId}`);

    return sessionToken;
  }

  /**
   * Validate session token
   */
  validateSessionToken(token: string): boolean {
    const sessionToken = this.sessionTokens.get(token);

    if (!sessionToken) {
      return false;
    }

    // Check expiration
    if (sessionToken.expiresAt < new Date()) {
      this.sessionTokens.delete(token);
      return false;
    }

    return true;
  }

  /**
   * Add consultation notes
   */
  async addConsultationNotes(
    sessionId: string,
    notes: string,
    userId: string,
    ipAddress: string
  ): Promise<ConsultationSession> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    // Verify doctor
    if (userId !== session.doctorId) {
      await logSecurityEvent({
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        resourceType: 'consultation',
        resourceId: sessionId,
        userId,
      });

      throw new Error('Only doctor can add notes');
    }

    session.notes = notes;

    // Log event
    await logAuditEvent({
      action: 'CONSULTATION_NOTES_ADDED',
      resourceType: 'consultation',
      resourceId: sessionId,
      userId,
      ipAddress,
      details: { notesLength: notes.length },
    });

    console.log(`[CONSULTATION] Notes added: ${sessionId}`);

    return session;
  }

  /**
   * Add prescription to consultation
   */
  async addPrescription(
    sessionId: string,
    prescriptions: ConsultationSession['prescription'],
    userId: string,
    ipAddress: string
  ): Promise<ConsultationSession> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    // Verify doctor
    if (userId !== session.doctorId) {
      await logSecurityEvent({
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        resourceType: 'consultation',
        resourceId: sessionId,
        userId,
      });

      throw new Error('Only doctor can add prescriptions');
    }

    session.prescription = prescriptions;

    // Log event
    await logAuditEvent({
      action: 'PRESCRIPTION_CREATED',
      resourceType: 'consultation',
      resourceId: sessionId,
      userId,
      ipAddress,
      details: { prescriptionCount: prescriptions?.length || 0 },
    });

    // Invalidate prescription cache
    invalidateCacheTag(CacheTags.PRESCRIPTIONS);

    console.log(`[CONSULTATION] Prescription added: ${sessionId}`);

    return session;
  }

  /**
   * Get consultation history
   */
  async getPatientConsultations(patientId: string): Promise<ConsultationSession[]> {
    const consultations: ConsultationSession[] = [];

    for (const session of this.sessions.values()) {
      if (session.patientId === patientId && session.status === 'completed') {
        consultations.push(session);
      }
    }

    return consultations.sort(
      (a, b) => (b.endTime?.getTime() || 0) - (a.endTime?.getTime() || 0)
    );
  }

  /**
   * Get doctor's ongoing consultations
   */
  async getDoctorActiveConsultations(doctorId: string): Promise<ConsultationSession[]> {
    const consultations: ConsultationSession[] = [];

    for (const session of this.sessions.values()) {
      if (session.doctorId === doctorId && session.status === 'in-progress') {
        consultations.push(session);
      }
    }

    return consultations;
  }

  /**
   * Cancel consultation
   */
  async cancelConsultation(
    sessionId: string,
    reason: string,
    userId: string,
    ipAddress: string
  ): Promise<ConsultationSession> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    session.status = 'cancelled';

    // Log event
    await logAuditEvent({
      action: 'CONSULTATION_CANCELLED',
      resourceType: 'consultation',
      resourceId: sessionId,
      userId,
      ipAddress,
      details: { reason },
    });

    console.log(`[CONSULTATION] Cancelled: ${sessionId}`);

    return session;
  }

  /**
   * Get session stats
   */
  getSessionStats() {
    let totalCompleted = 0;
    let totalDuration = 0;
    let activeCount = 0;

    for (const session of this.sessions.values()) {
      if (session.status === 'completed') {
        totalCompleted++;
        totalDuration += session.duration || 0;
      } else if (session.status === 'in-progress') {
        activeCount++;
      }
    }

    return {
      totalSessions: this.sessions.size,
      completedSessions: totalCompleted,
      activeSessions: activeCount,
      averageDuration: totalCompleted > 0 ? Math.round(totalDuration / totalCompleted) : 0,
      totalTokensIssued: this.sessionTokens.size,
    };
  }

  /**
   * Clean up expired sessions
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      // Remove completed sessions older than 30 days
      if (session.status === 'completed' && session.endTime) {
        const age = now - session.endTime.getTime();
        if (age > 30 * 24 * 60 * 60 * 1000) {
          this.sessions.delete(sessionId);
          cleaned++;
        }
      }
    }

    if (cleaned > 0) {
      console.log(`[CONSULTATION] Cleaned up ${cleaned} old sessions`);
    }

    return cleaned;
  }
}

/**
 * Global consultation service instance
 */
export const consultationService = new ConsultationService();
