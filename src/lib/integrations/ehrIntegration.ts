/**
 * EHR (Electronic Health Record) Integration Service
 * Connect with external EHR systems (Epic, Cerner, Allscripts, etc.)
 */

import { logAudit, AuditAction } from '@/lib/audit/logger';

interface EHRConfig {
  id: string;
  organizationId: string;
  ehrVendor: 'epic' | 'cerner' | 'allscripts' | 'medidata' | 'custom';
  apiEndpoint: string;
  clientId: string;
  clientSecret: string;
  authenticationType: 'oauth2' | 'fhir' | 'hl7v2' | 'custom';
  dataSyncFrequency: 'real-time' | 'hourly' | 'daily';
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface PatientRecord {
  id: string;
  organizationId: string;
  ehrId: string; // EHR system patient ID
  localPatientId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  mrn: string; // Medical Record Number
  allergies: string[];
  medications: string[];
  conditions: string[];
  lastSyncTime: Date;
  syncStatus: 'synced' | 'pending' | 'failed';
}

interface MedicalRecordSync {
  id: string;
  organizationId: string;
  ehrConfigId: string;
  patientId: string;
  recordType: 'vital_signs' | 'lab_results' | 'medications' | 'diagnoses' | 'procedures';
  sourceEHR: boolean; // true = EHR→Local, false = Local→EHR
  syncTime: Date;
  status: 'success' | 'failed' | 'partial';
  recordCount: number;
  errorMessage?: string;
}

interface HL7Message {
  id: string;
  organizationId: string;
  ehrConfigId: string;
  messageType: 'ADT' | 'ORM' | 'ORU' | 'RGV' | 'DFT' | 'MDM';
  content: string;
  direction: 'inbound' | 'outbound';
  timestamp: Date;
  status: 'sent' | 'received' | 'acknowledged' | 'failed';
  acknowledgment?: string;
}

interface FHIRResource {
  id: string;
  organizationId: string;
  resourceType: 'Patient' | 'Observation' | 'Medication' | 'Condition' | 'Procedure' | 'AllergyIntolerance';
  ehrId: string;
  localId: string;
  content: Record<string, any>;
  lastModified: Date;
  syncStatus: 'synced' | 'pending' | 'failed';
}

const ehrConfigs = new Map<string, EHRConfig>();
const patientRecords = new Map<string, PatientRecord[]>();
const medicalRecordSyncs = new Map<string, MedicalRecordSync[]>();
const hl7Messages = new Map<string, HL7Message[]>();
const fhirResources = new Map<string, FHIRResource[]>();

export class EHRIntegrationService {
  static async configureEHR(
    organizationId: string,
    ehrVendor: 'epic' | 'cerner' | 'allscripts' | 'medidata' | 'custom',
    apiEndpoint: string,
    clientId: string,
    clientSecret: string,
    authenticationType: 'oauth2' | 'fhir' | 'hl7v2' | 'custom',
    dataSyncFrequency: 'real-time' | 'hourly' | 'daily' = 'hourly'
  ): Promise<EHRConfig> {
    const id = `ehr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const config: EHRConfig = {
      id,
      organizationId,
      ehrVendor,
      apiEndpoint,
      clientId,
      clientSecret,
      authenticationType,
      dataSyncFrequency,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    };

    ehrConfigs.set(id, config);

    await logAudit(null, AuditAction.SETTINGS_UPDATED, 'EHR_CONFIG_CREATED', id, {
      status: 'SUCCESS',
      details: { organizationId, ehrVendor, authenticationType },
    });

    return config;
  }

  static async syncPatientFromEHR(
    ehrConfigId: string,
    ehrPatientId: string,
    patientData: {
      firstName: string;
      lastName: string;
      dateOfBirth: string;
      mrn: string;
      allergies?: string[];
      medications?: string[];
      conditions?: string[];
    }
  ): Promise<PatientRecord> {
    const config = ehrConfigs.get(ehrConfigId);
    if (!config) throw new Error('EHR config not found');

    const recordId = `patient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const record: PatientRecord = {
      id: recordId,
      organizationId: config.organizationId,
      ehrId: ehrPatientId,
      localPatientId: recordId,
      firstName: patientData.firstName,
      lastName: patientData.lastName,
      dateOfBirth: patientData.dateOfBirth,
      mrn: patientData.mrn,
      allergies: patientData.allergies || [],
      medications: patientData.medications || [],
      conditions: patientData.conditions || [],
      lastSyncTime: new Date(),
      syncStatus: 'synced',
    };

    if (!patientRecords.has(config.organizationId)) {
      patientRecords.set(config.organizationId, []);
    }

    patientRecords.get(config.organizationId)!.push(record);

    await logAudit(null, AuditAction.SETTINGS_UPDATED, 'PATIENT_SYNCED_FROM_EHR', recordId, {
      status: 'SUCCESS',
      details: { ehrVendor: config.ehrVendor, mrn: patientData.mrn },
    });

    return record;
  }

  static async recordMedicalRecordSync(
    organizationId: string,
    ehrConfigId: string,
    patientId: string,
    recordType: 'vital_signs' | 'lab_results' | 'medications' | 'diagnoses' | 'procedures',
    sourceEHR: boolean,
    recordCount: number,
    success: boolean,
    errorMessage?: string
  ): Promise<MedicalRecordSync> {
    const syncId = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const sync: MedicalRecordSync = {
      id: syncId,
      organizationId,
      ehrConfigId,
      patientId,
      recordType,
      sourceEHR,
      syncTime: new Date(),
      status: success ? 'success' : 'failed',
      recordCount,
      errorMessage,
    };

    if (!medicalRecordSyncs.has(organizationId)) {
      medicalRecordSyncs.set(organizationId, []);
    }

    medicalRecordSyncs.get(organizationId)!.push(sync);

    if (!success) {
      await logAudit(null, AuditAction.SETTINGS_UPDATED, 'MEDICAL_RECORD_SYNC_FAILED', syncId, {
        status: 'ALERT',
        details: { recordType, errorMessage },
      });
    }

    return sync;
  }

  static async sendHL7Message(
    organizationId: string,
    ehrConfigId: string,
    messageType: 'ADT' | 'ORM' | 'ORU' | 'RGV' | 'DFT' | 'MDM',
    content: string
  ): Promise<HL7Message> {
    const messageId = `hl7_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const message: HL7Message = {
      id: messageId,
      organizationId,
      ehrConfigId,
      messageType,
      content,
      direction: 'outbound',
      timestamp: new Date(),
      status: 'sent',
    };

    if (!hl7Messages.has(organizationId)) {
      hl7Messages.set(organizationId, []);
    }

    hl7Messages.get(organizationId)!.push(message);

    await logAudit(null, AuditAction.SETTINGS_UPDATED, 'HL7_MESSAGE_SENT', messageId, {
      status: 'SUCCESS',
      details: { messageType, direction: 'outbound' },
    });

    return message;
  }

  static async receiveHL7Message(
    organizationId: string,
    ehrConfigId: string,
    messageType: 'ADT' | 'ORM' | 'ORU' | 'RGV' | 'DFT' | 'MDM',
    content: string
  ): Promise<HL7Message> {
    const messageId = `hl7_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const message: HL7Message = {
      id: messageId,
      organizationId,
      ehrConfigId,
      messageType,
      content,
      direction: 'inbound',
      timestamp: new Date(),
      status: 'received',
      acknowledgment: `ACK^A01^ACK`,
    };

    if (!hl7Messages.has(organizationId)) {
      hl7Messages.set(organizationId, []);
    }

    hl7Messages.get(organizationId)!.push(message);

    await logAudit(null, AuditAction.SETTINGS_UPDATED, 'HL7_MESSAGE_RECEIVED', messageId, {
      status: 'SUCCESS',
      details: { messageType, direction: 'inbound' },
    });

    return message;
  }

  static async createFHIRResource(
    organizationId: string,
    resourceType: 'Patient' | 'Observation' | 'Medication' | 'Condition' | 'Procedure' | 'AllergyIntolerance',
    ehrId: string,
    content: Record<string, any>
  ): Promise<FHIRResource> {
    const resourceId = `fhir_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const resource: FHIRResource = {
      id: resourceId,
      organizationId,
      resourceType,
      ehrId,
      localId: resourceId,
      content,
      lastModified: new Date(),
      syncStatus: 'synced',
    };

    if (!fhirResources.has(organizationId)) {
      fhirResources.set(organizationId, []);
    }

    fhirResources.get(organizationId)!.push(resource);

    return resource;
  }

  static async getPatientRecords(organizationId: string): Promise<PatientRecord[]> {
    return patientRecords.get(organizationId) || [];
  }

  static async getSyncHistory(organizationId: string, days: number = 7): Promise<MedicalRecordSync[]> {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const syncs = medicalRecordSyncs.get(organizationId) || [];

    return syncs.filter((s) => s.syncTime > cutoff);
  }

  static async getHL7MessageHistory(organizationId: string, days: number = 30): Promise<HL7Message[]> {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const messages = hl7Messages.get(organizationId) || [];

    return messages.filter((m) => m.timestamp > cutoff);
  }

  static async getIntegrationStatus(ehrConfigId: string): Promise<{
    configId: string;
    lastSyncTime: Date | null;
    patientCount: number;
    recordsSynced: number;
    syncFailureCount: number;
    healthStatus: 'healthy' | 'degraded' | 'unhealthy';
  }> {
    const config = ehrConfigs.get(ehrConfigId);
    if (!config) throw new Error('EHR config not found');

    const syncs = medicalRecordSyncs.get(config.organizationId) || [];
    const recentSyncs = syncs.filter((s) => s.ehrConfigId === ehrConfigId);

    const lastSync = recentSyncs.length > 0 ? recentSyncs[recentSyncs.length - 1].syncTime : null;
    const failedCount = recentSyncs.filter((s) => s.status === 'failed').length;

    const patients = patientRecords.get(config.organizationId) || [];
    const recordsSynced = patients.reduce((sum, p) => sum + p.medications.length, 0);

    const failureRate = recentSyncs.length > 0 ? (failedCount / recentSyncs.length) * 100 : 0;

    let health: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (failureRate > 10) health = 'unhealthy';
    else if (failureRate > 5) health = 'degraded';

    return {
      configId: ehrConfigId,
      lastSyncTime: lastSync,
      patientCount: patients.length,
      recordsSynced,
      syncFailureCount: failedCount,
      healthStatus: health,
    };
  }

  static async disableEHRConfig(ehrConfigId: string): Promise<void> {
    const config = ehrConfigs.get(ehrConfigId);
    if (config) {
      config.enabled = false;
      config.updatedAt = new Date();
    }

    await logAudit(null, AuditAction.SETTINGS_UPDATED, 'EHR_CONFIG_DISABLED', ehrConfigId, {
      status: 'SUCCESS',
      details: {},
    });
  }

  static async testEHRConnection(ehrConfigId: string): Promise<{ success: boolean; message: string }> {
    const config = ehrConfigs.get(ehrConfigId);
    if (!config) {
      return { success: false, message: 'EHR config not found' };
    }

    try {
      // Simulate connection test
      return { success: true, message: `Connected to ${config.ehrVendor}` };
    } catch (error) {
      return { success: false, message: `Connection failed: ${error}` };
    }
  }
}
