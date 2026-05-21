/**
 * Audit Logging System
 *
 * Tracks all sensitive operations for compliance (HIPAA, GDPR)
 * Healthcare data access and modifications are logged
 */

import { createWriteStream } from 'fs';
import path from 'path';

export enum AuditAction {
  // Authentication
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  REGISTER = 'REGISTER',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PASSWORD_RESET = 'PASSWORD_RESET',
  MFA_ENABLED = 'MFA_ENABLED',
  MFA_DISABLED = 'MFA_DISABLED',

  // Appointments
  APPOINTMENT_CREATED = 'APPOINTMENT_CREATED',
  APPOINTMENT_UPDATED = 'APPOINTMENT_UPDATED',
  APPOINTMENT_CANCELLED = 'APPOINTMENT_CANCELLED',
  APPOINTMENT_COMPLETED = 'APPOINTMENT_COMPLETED',
  APPOINTMENT_RESCHEDULED = 'APPOINTMENT_RESCHEDULED',

  // Medical Records
  MEDICAL_RECORD_CREATED = 'MEDICAL_RECORD_CREATED',
  MEDICAL_RECORD_ACCESSED = 'MEDICAL_RECORD_ACCESSED',
  MEDICAL_RECORD_UPDATED = 'MEDICAL_RECORD_UPDATED',
  MEDICAL_RECORD_DELETED = 'MEDICAL_RECORD_DELETED',

  // Prescriptions
  PRESCRIPTION_CREATED = 'PRESCRIPTION_CREATED',
  PRESCRIPTION_ACCESSED = 'PRESCRIPTION_ACCESSED',
  PRESCRIPTION_UPDATED = 'PRESCRIPTION_UPDATED',

  // Patient Data
  PATIENT_DATA_ACCESSED = 'PATIENT_DATA_ACCESSED',
  PATIENT_DATA_EXPORTED = 'PATIENT_DATA_EXPORTED',
  PATIENT_DATA_DELETED = 'PATIENT_DATA_DELETED',

  // Payments
  PAYMENT_PROCESSED = 'PAYMENT_PROCESSED',
  PAYMENT_REFUNDED = 'PAYMENT_REFUNDED',

  // User Management
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DEACTIVATED = 'USER_DEACTIVATED',
  USER_ROLE_CHANGED = 'USER_ROLE_CHANGED',

  // Security
  SECURITY_BREACH_ATTEMPT = 'SECURITY_BREACH_ATTEMPT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  UNAUTHORIZED_ACCESS_ATTEMPT = 'UNAUTHORIZED_ACCESS_ATTEMPT',

  // Admin Actions
  ADMIN_ACTION = 'ADMIN_ACTION',
  SYSTEM_CONFIG_CHANGED = 'SYSTEM_CONFIG_CHANGED',
}

export interface AuditLog {
  timestamp: string;
  requestId: string;
  userId: string | null;
  action: AuditAction;
  resourceType: string;
  resourceId: string | null;
  status: 'SUCCESS' | 'FAILURE';
  ipAddress: string | null;
  userAgent: string | null;
  details?: Record<string, any>;
  errorMessage?: string;
}

/**
 * In-memory buffer for audit logs
 * In production, use a proper database
 */
const auditLogsBuffer: AuditLog[] = [];
const MAX_BUFFER_SIZE = 1000;

/**
 * Log an audit event
 */
export async function logAudit(
  userId: string | null,
  action: AuditAction,
  resourceType: string,
  resourceId: string | null,
  options?: {
    status?: 'SUCCESS' | 'FAILURE';
    ipAddress?: string | null;
    userAgent?: string | null;
    details?: Record<string, any>;
    errorMessage?: string;
    requestId?: string;
  }
): Promise<void> {
  const auditLog: AuditLog = {
    timestamp: new Date().toISOString(),
    requestId: options?.requestId || generateRequestId(),
    userId,
    action,
    resourceType,
    resourceId,
    status: options?.status || 'SUCCESS',
    ipAddress: options?.ipAddress || null,
    userAgent: options?.userAgent || null,
    details: options?.details,
    errorMessage: options?.errorMessage,
  };

  // Add to buffer
  auditLogsBuffer.push(auditLog);

  // Flush to database if buffer is full
  if (auditLogsBuffer.length >= MAX_BUFFER_SIZE) {
    await flushAuditLogs();
  }

  // Log sensitive actions immediately to console (for development)
  if (process.env.NODE_ENV === 'development') {
    logSensitiveAction(auditLog);
  }
}

export const logAuditEvent = logAudit;

/**
 * Log authentication event
 */
export async function logAuthEvent(
  userId: string | null,
  action: AuditAction,
  success: boolean,
  ipAddress?: string | null,
  userAgent?: string | null,
  details?: Record<string, any>
): Promise<void> {
  await logAudit(userId, action, 'USER', userId, {
    status: success ? 'SUCCESS' : 'FAILURE',
    ipAddress,
    userAgent,
    details,
  });
}

/**
 * Log patient data access
 */
export async function logPatientDataAccess(
  userId: string,
  patientId: string,
  action: AuditAction,
  ipAddress?: string | null,
  details?: Record<string, any>
): Promise<void> {
  await logAudit(userId, action, 'PATIENT_DATA', patientId, {
    ipAddress,
    details: {
      ...details,
      accessedUserId: userId,
      accessedPatientId: patientId,
    },
  });
}

/**
 * Log medical record access
 */
export async function logMedicalRecordAccess(
  userId: string,
  recordId: string,
  action: AuditAction,
  ipAddress?: string | null,
  details?: Record<string, any>
): Promise<void> {
  await logAudit(userId, action, 'MEDICAL_RECORD', recordId, {
    ipAddress,
    details,
  });
}

/**
 * Log security event
 */
export async function logSecurityEvent(
  action: AuditAction,
  resourceType: string,
  resourceId: string | null,
  ipAddress: string | null,
  details?: Record<string, any>,
  errorMessage?: string
): Promise<void> {
  await logAudit(null, action, resourceType, resourceId, {
    status: 'FAILURE',
    ipAddress,
    details,
    errorMessage,
  });
}

/**
 * Flush audit logs to database
 * In production, save to persistent storage
 */
export async function flushAuditLogs(): Promise<void> {
  if (auditLogsBuffer.length === 0) return;

  const logsToFlush = [...auditLogsBuffer];
  auditLogsBuffer.length = 0;

  // TODO: Save to database
  // await db.auditLogs.createMany(logsToFlush);

  console.log(`[AUDIT] Flushed ${logsToFlush.length} audit logs`);
}

/**
 * Get audit logs for a user
 */
export async function getUserAuditLogs(
  userId: string,
  limit: number = 100
): Promise<AuditLog[]> {
  // Filter from buffer (in production, query database)
  return auditLogsBuffer
    .filter((log) => log.userId === userId)
    .slice(-limit);
}

/**
 * Get audit logs for a resource
 */
export async function getResourceAuditLogs(
  resourceType: string,
  resourceId: string,
  limit: number = 100
): Promise<AuditLog[]> {
  return auditLogsBuffer
    .filter((log) => log.resourceType === resourceType && log.resourceId === resourceId)
    .slice(-limit);
}

/**
 * Get audit logs by action type
 */
export async function getAuditLogsByAction(
  action: AuditAction,
  limit: number = 100
): Promise<AuditLog[]> {
  return auditLogsBuffer
    .filter((log) => log.action === action)
    .slice(-limit);
}

/**
 * Log sensitive actions to console
 */
function logSensitiveAction(log: AuditLog): void {
  const sensitiveActions = [
    AuditAction.LOGIN,
    AuditAction.LOGOUT,
    AuditAction.PASSWORD_CHANGE,
    AuditAction.PATIENT_DATA_ACCESSED,
    AuditAction.MEDICAL_RECORD_ACCESSED,
    AuditAction.PAYMENT_PROCESSED,
    AuditAction.UNAUTHORIZED_ACCESS_ATTEMPT,
    AuditAction.SECURITY_BREACH_ATTEMPT,
  ];

  if (sensitiveActions.includes(log.action)) {
    console.log('[AUDIT LOG]', {
      timestamp: log.timestamp,
      userId: log.userId,
      action: log.action,
      status: log.status,
      resourceType: log.resourceType,
      resourceId: log.resourceId,
    });
  }
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Export audit logs to file (for auditing/compliance)
 */
export async function exportAuditLogs(
  format: 'json' | 'csv' = 'json'
): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `audit-logs-${timestamp}.${format === 'json' ? 'json' : 'csv'}`;

  if (format === 'json') {
    return JSON.stringify(auditLogsBuffer, null, 2);
  } else {
    // CSV format
    const headers = Object.keys(auditLogsBuffer[0] || {});
    const csv = [
      headers.join(','),
      ...auditLogsBuffer.map((log) =>
        headers
          .map((header) => {
            const value = (log as any)[header];
            if (typeof value === 'string') {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(',')
      ),
    ].join('\n');
    return csv;
  }
}
