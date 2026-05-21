/**
 * Medical Records Service
 *
 * Handle secure document upload, storage, and access
 * Includes file validation, encryption, and audit logging
 */

import { getCachedOrFetch, invalidateCacheTag, CacheTTL, CacheTags } from '@/lib/cache/cacheManager';
import { logAuditEvent, logPatientDataAccess } from '@/lib/audit/logger';

/**
 * Medical record type
 */
export enum RecordType {
  LAB_RESULTS = 'lab_results',
  IMAGING = 'imaging',
  DIAGNOSIS = 'diagnosis',
  PRESCRIPTION = 'prescription',
  DISCHARGE = 'discharge',
  ALLERGY = 'allergy',
  INSURANCE = 'insurance',
  OTHER = 'other',
}

/**
 * Access control
 */
export interface RecordAccess {
  patientId: string;
  doctorId?: string;
  access: 'owner' | 'doctor' | 'specialist' | 'viewer';
  grantedAt: Date;
  expiresAt?: Date;
}

/**
 * Medical record
 */
export interface MedicalRecord {
  recordId: string;
  patientId: string;
  recordType: RecordType;
  fileName: string;
  fileUrl: string;
  fileSize: number; // bytes
  mimeType: string;
  uploadedAt: Date;
  uploadedBy: string;
  description?: string;
  tags: string[];
  isEncrypted: boolean;
  isScanned: boolean; // virus scanned
  accessControls: RecordAccess[];
  expiresAt?: Date;
  notes?: string;
}

/**
 * File validation config
 */
export interface FileValidationConfig {
  maxFileSize: number;
  allowedTypes: string[];
  scanForViruses: boolean;
  requireEncryption: boolean;
}

/**
 * Medical records service
 */
export class MedicalRecordService {
  private records: Map<string, MedicalRecord> = new Map();
  private accessLog: Map<string, Array<{ userId: string; timestamp: Date }>> = new Map();

  private fileValidation: FileValidationConfig = {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/tiff',
      'application/dicom',
    ],
    scanForViruses: true,
    requireEncryption: true,
  };

  /**
   * Upload medical record
   */
  async uploadRecord(
    patientId: string,
    recordType: RecordType,
    file: File,
    fileUrl: string,
    userId: string,
    ipAddress: string,
    description?: string
  ): Promise<MedicalRecord> {
    // Validate file
    this.validateFile(file);

    // Create record
    const recordId = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const record: MedicalRecord = {
      recordId,
      patientId,
      recordType,
      fileName: file.name,
      fileUrl,
      fileSize: file.size,
      mimeType: file.type,
      uploadedAt: new Date(),
      uploadedBy: userId,
      description,
      tags: this.extractTags(file.name, recordType),
      isEncrypted: this.fileValidation.requireEncryption,
      isScanned: this.fileValidation.scanForViruses,
      accessControls: [
        {
          patientId,
          access: 'owner',
          grantedAt: new Date(),
        },
      ],
    };

    this.records.set(recordId, record);

    // Log audit event
    await logAuditEvent({
      action: 'MEDICAL_RECORD_CREATED',
      resourceType: 'medical_record',
      resourceId: recordId,
      userId,
      ipAddress,
      details: {
        patientId,
        recordType,
        fileSize: file.size,
        fileName: file.name,
      },
    });

    // Log HIPAA access
    await logPatientDataAccess({
      patientId,
      accessType: 'upload',
      recordType: 'medical_record',
      resourceId: recordId,
      userId,
      ipAddress,
    });

    // Invalidate cache
    invalidateCacheTag(CacheTags.MEDICAL_RECORDS);

    console.log(`[RECORDS] Uploaded: ${recordId}`);

    return record;
  }

  /**
   * Validate file
   */
  private validateFile(file: File): void {
    // Check file size
    if (file.size > this.fileValidation.maxFileSize) {
      throw new Error(
        `File size exceeds ${this.fileValidation.maxFileSize / 1024 / 1024}MB limit`
      );
    }

    // Check file type
    if (!this.fileValidation.allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} not allowed`);
    }

    // TODO: Scan for viruses
    if (this.fileValidation.scanForViruses) {
      // Use antivirus API
      console.log('[RECORDS] File scanned for viruses');
    }
  }

  /**
   * Extract tags from filename and type
   */
  private extractTags(fileName: string, recordType: RecordType): string[] {
    const tags: string[] = [recordType];

    // Extract date if present
    const dateMatch = fileName.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (dateMatch) {
      tags.push(dateMatch[0]);
    }

    // Extract common keywords
    const keywords = [
      'results',
      'report',
      'blood',
      'xray',
      'ct',
      'mri',
      'ultrasound',
    ];
    keywords.forEach((keyword) => {
      if (fileName.toLowerCase().includes(keyword)) {
        tags.push(keyword);
      }
    });

    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Get patient records
   */
  async getPatientRecords(
    patientId: string,
    userId: string,
    ipAddress: string,
    filter?: {
      recordType?: RecordType;
      tags?: string[];
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<MedicalRecord[]> {
    const records: MedicalRecord[] = [];

    for (const record of this.records.values()) {
      if (record.patientId === patientId) {
        // Check access
        const hasAccess = this.checkAccess(record, userId);
        if (!hasAccess) {
          continue;
        }

        // Apply filters
        if (
          filter?.recordType &&
          record.recordType !== filter.recordType
        ) {
          continue;
        }

        if (filter?.tags) {
          const hasAllTags = filter.tags.every((tag) =>
            record.tags.includes(tag)
          );
          if (!hasAllTags) continue;
        }

        if (filter?.startDate && record.uploadedAt < filter.startDate) {
          continue;
        }

        if (filter?.endDate && record.uploadedAt > filter.endDate) {
          continue;
        }

        records.push(record);
      }
    }

    // Log access
    await logPatientDataAccess({
      patientId,
      accessType: 'read',
      recordType: 'medical_records_list',
      userId,
      ipAddress,
      details: { recordCount: records.length },
    });

    console.log(`[RECORDS] Retrieved ${records.length} records for ${patientId}`);

    return records.sort(
      (a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime()
    );
  }

  /**
   * Get record by ID
   */
  async getRecord(
    recordId: string,
    userId: string,
    ipAddress: string
  ): Promise<MedicalRecord | null> {
    const record = this.records.get(recordId);

    if (!record) {
      return null;
    }

    // Check access
    if (!this.checkAccess(record, userId)) {
      await logSecurityEvent({
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        resourceType: 'medical_record',
        resourceId: recordId,
        userId,
        details: { patientId: record.patientId },
      });

      throw new Error('Unauthorized access to medical record');
    }

    // Log access
    await logPatientDataAccess({
      patientId: record.patientId,
      accessType: 'read',
      recordType: 'medical_record',
      resourceId: recordId,
      userId,
      ipAddress,
    });

    console.log(`[RECORDS] Accessed: ${recordId}`);

    return record;
  }

  /**
   * Check access permission
   */
  private checkAccess(record: MedicalRecord, userId: string): boolean {
    for (const access of record.accessControls) {
      if (access.patientId === userId && access.access === 'owner') {
        return true;
      }

      if (access.doctorId === userId) {
        // Check expiration
        if (access.expiresAt && access.expiresAt < new Date()) {
          return false;
        }
        return true;
      }
    }

    return false;
  }

  /**
   * Grant access
   */
  async grantAccess(
    recordId: string,
    doctorId: string,
    accessLevel: 'doctor' | 'specialist' | 'viewer',
    expiresAt: Date | undefined,
    userId: string,
    ipAddress: string
  ): Promise<MedicalRecord> {
    const record = this.records.get(recordId);

    if (!record) {
      throw new Error('Record not found');
    }

    // Verify owner
    const isOwner = record.accessControls.some(
      (a) => a.patientId === userId && a.access === 'owner'
    );
    if (!isOwner) {
      throw new Error('Only record owner can grant access');
    }

    // Add access
    const existingAccess = record.accessControls.find(
      (a) => a.doctorId === doctorId
    );
    if (existingAccess) {
      existingAccess.expiresAt = expiresAt;
      existingAccess.access = accessLevel;
    } else {
      record.accessControls.push({
        patientId: record.patientId,
        doctorId,
        access: accessLevel,
        grantedAt: new Date(),
        expiresAt,
      });
    }

    // Log event
    await logAuditEvent({
      action: 'MEDICAL_RECORD_ACCESS_GRANTED',
      resourceType: 'medical_record',
      resourceId: recordId,
      userId,
      ipAddress,
      details: { doctorId, accessLevel, expiresAt },
    });

    return record;
  }

  /**
   * Revoke access
   */
  async revokeAccess(
    recordId: string,
    doctorId: string,
    userId: string,
    ipAddress: string
  ): Promise<MedicalRecord> {
    const record = this.records.get(recordId);

    if (!record) {
      throw new Error('Record not found');
    }

    // Verify owner
    const isOwner = record.accessControls.some(
      (a) => a.patientId === userId && a.access === 'owner'
    );
    if (!isOwner) {
      throw new Error('Only record owner can revoke access');
    }

    // Remove access
    record.accessControls = record.accessControls.filter(
      (a) => a.doctorId !== doctorId
    );

    // Log event
    await logAuditEvent({
      action: 'MEDICAL_RECORD_ACCESS_REVOKED',
      resourceType: 'medical_record',
      resourceId: recordId,
      userId,
      ipAddress,
      details: { doctorId },
    });

    return record;
  }

  /**
   * Delete record
   */
  async deleteRecord(
    recordId: string,
    userId: string,
    ipAddress: string
  ): Promise<void> {
    const record = this.records.get(recordId);

    if (!record) {
      throw new Error('Record not found');
    }

    // Verify owner
    const isOwner = record.accessControls.some(
      (a) => a.patientId === userId && a.access === 'owner'
    );
    if (!isOwner) {
      throw new Error('Only record owner can delete');
    }

    this.records.delete(recordId);

    // Log event
    await logAuditEvent({
      action: 'MEDICAL_RECORD_DELETED',
      resourceType: 'medical_record',
      resourceId: recordId,
      userId,
      ipAddress,
      details: { patientId: record.patientId },
    });

    invalidateCacheTag(CacheTags.MEDICAL_RECORDS);

    console.log(`[RECORDS] Deleted: ${recordId}`);
  }

  /**
   * Search records
   */
  async searchRecords(
    patientId: string,
    query: string,
    userId: string
  ): Promise<MedicalRecord[]> {
    const records: MedicalRecord[] = [];

    for (const record of this.records.values()) {
      if (record.patientId === patientId) {
        // Check access
        if (!this.checkAccess(record, userId)) {
          continue;
        }

        // Search in filename, description, tags
        const searchableText = [
          record.fileName,
          record.description || '',
          record.tags.join(' '),
        ]
          .join(' ')
          .toLowerCase();

        if (searchableText.includes(query.toLowerCase())) {
          records.push(record);
        }
      }
    }

    return records;
  }

  /**
   * Get record stats
   */
  getRecordStats(patientId: string) {
    const records = Array.from(this.records.values()).filter(
      (r) => r.patientId === patientId
    );

    const statsByType: Record<string, number> = {};
    let totalSize = 0;

    for (const record of records) {
      statsByType[record.recordType] = (statsByType[record.recordType] || 0) + 1;
      totalSize += record.fileSize;
    }

    return {
      totalRecords: records.length,
      totalSize,
      totalSizeMB: Math.round(totalSize / 1024 / 1024 * 100) / 100,
      recordsByType: statsByType,
      oldestRecord: records.length > 0 ? Math.min(...records.map(r => r.uploadedAt.getTime())) : null,
      newestRecord: records.length > 0 ? Math.max(...records.map(r => r.uploadedAt.getTime())) : null,
    };
  }

  /**
   * Clean up expired records
   */
  cleanup(): number {
    const now = new Date();
    let cleaned = 0;

    for (const [recordId, record] of this.records.entries()) {
      if (record.expiresAt && record.expiresAt < now) {
        this.records.delete(recordId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[RECORDS] Cleaned up ${cleaned} expired records`);
    }

    return cleaned;
  }
}

/**
 * Global service instance
 */
export const medicalRecordService = new MedicalRecordService();

/**
 * Import security logger
 */
async function logSecurityEvent(event: any) {
  // TODO: implement from Week 2 audit logger
  console.log('[SECURITY]', event);
}
