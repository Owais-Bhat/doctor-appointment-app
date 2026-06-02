/**
 * Pharmacy Systems Integration Service
 * Connect with pharmacy platforms for medication management and refills
 */

import { logAudit, AuditAction } from '@/lib/audit/logger';

interface PharmacyConfig {
  id: string;
  organizationId: string;
  pharmacyProvider: 'walgreens' | 'cvs' | 'target' | 'custom_pharmacy' | 'ncpdp';
  apiEndpoint: string;
  ncpdpId: string; // NCPDP Provider ID
  storefrontId?: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Prescription {
  id: string;
  organizationId: string;
  patientId: string;
  medicationName: string;
  ndc: string; // National Drug Code
  dosage: string;
  quantity: number;
  refills: number;
  daysSupply: number;
  prescribedBy: string;
  prescriptionDate: Date;
  expirationDate: Date;
  status: 'active' | 'filled' | 'expired' | 'cancelled';
  fillHistory: Array<{
    fillDate: Date;
    pharmacyId: string;
    pharmacyName: string;
    filledQuantity: number;
    refillsRemaining: number;
  }>;
}

interface PharmacyNetwork {
  id: string;
  organizationId: string;
  pharmacyId: string;
  pharmacyName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phoneNumber: string;
  serviceHours: string;
  distanceFromPatient: number; // Miles
  acceptsInsurance: boolean;
  deliveryAvailable: boolean;
}

interface MedicationInventory {
  id: string;
  organizationId: string;
  pharmacyId: string;
  medicationName: string;
  ndc: string;
  quantity: number;
  reorderPoint: number;
  lastRestockDate: Date;
  expirationDate: Date;
  price: number;
}

interface RefillRequest {
  id: string;
  organizationId: string;
  patientId: string;
  prescriptionId: string;
  requestDate: Date;
  requestedPharmacyId?: string;
  status: 'pending' | 'approved' | 'filled' | 'rejected';
  rejectionReason?: string;
  filledDate?: Date;
  pickupDate?: Date;
}

interface DrugInteractionCheck {
  id: string;
  organizationId: string;
  patientId: string;
  prescriptionId: string;
  otherMedications: string[];
  timestamp: Date;
  interactions: Array<{
    severity: 'mild' | 'moderate' | 'severe';
    interaction: string;
    recommendation: string;
  }>;
}

const pharmacyConfigs = new Map<string, PharmacyConfig>();
const prescriptions = new Map<string, Prescription[]>();
const pharmacyNetworks = new Map<string, PharmacyNetwork[]>();
const medicationInventory = new Map<string, MedicationInventory[]>();
const refillRequests = new Map<string, RefillRequest[]>();
const interactionChecks = new Map<string, DrugInteractionCheck[]>();

export class PharmacyIntegrationService {
  static async configurePharmacy(
    organizationId: string,
    pharmacyProvider: 'walgreens' | 'cvs' | 'target' | 'custom_pharmacy' | 'ncpdp',
    apiEndpoint: string,
    ncpdpId: string,
    storefrontId?: string
  ): Promise<PharmacyConfig> {
    const id = `pharmacy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const config: PharmacyConfig = {
      id,
      organizationId,
      pharmacyProvider,
      apiEndpoint,
      ncpdpId,
      storefrontId,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    };

    pharmacyConfigs.set(id, config);

    await logAudit(null, AuditAction.SETTINGS_UPDATED, 'PHARMACY_CONFIG_CREATED', id, {
      status: 'SUCCESS',
      details: { organizationId, pharmacyProvider, ncpdpId },
    });

    return config;
  }

  static async createPrescription(
    organizationId: string,
    patientId: string,
    medicationName: string,
    ndc: string,
    dosage: string,
    quantity: number,
    refills: number,
    daysSupply: number,
    prescribedBy: string
  ): Promise<Prescription> {
    const prescriptionId = `rx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const prescription: Prescription = {
      id: prescriptionId,
      organizationId,
      patientId,
      medicationName,
      ndc,
      dosage,
      quantity,
      refills,
      daysSupply,
      prescribedBy,
      prescriptionDate: now,
      expirationDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000), // 1 year
      status: 'active',
      fillHistory: [],
    };

    if (!prescriptions.has(organizationId)) {
      prescriptions.set(organizationId, []);
    }

    prescriptions.get(organizationId)!.push(prescription);

    await logAudit(null, AuditAction.SETTINGS_UPDATED, 'PRESCRIPTION_CREATED', prescriptionId, {
      status: 'SUCCESS',
      details: { patientId, medicationName, ndc },
    });

    return prescription;
  }

  static async requestRefill(
    organizationId: string,
    patientId: string,
    prescriptionId: string,
    requestedPharmacyId?: string
  ): Promise<RefillRequest> {
    const refillId = `refill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const refill: RefillRequest = {
      id: refillId,
      organizationId,
      patientId,
      prescriptionId,
      requestDate: new Date(),
      requestedPharmacyId,
      status: 'pending',
    };

    if (!refillRequests.has(organizationId)) {
      refillRequests.set(organizationId, []);
    }

    refillRequests.get(organizationId)!.push(refill);

    await logAudit(null, AuditAction.SETTINGS_UPDATED, 'REFILL_REQUESTED', refillId, {
      status: 'SUCCESS',
      details: { patientId, prescriptionId },
    });

    return refill;
  }

  static async updateRefillStatus(
    organizationId: string,
    refillId: string,
    status: 'approved' | 'filled' | 'rejected',
    rejectionReason?: string,
    filledDate?: Date
  ): Promise<RefillRequest | null> {
    const refills = refillRequests.get(organizationId) || [];
    const refill = refills.find((r) => r.id === refillId);

    if (refill) {
      refill.status = status;
      if (rejectionReason) refill.rejectionReason = rejectionReason;
      if (filledDate) refill.filledDate = filledDate;

      // Update prescription fill history if filled
      if (status === 'filled') {
        const orginscriptions = prescriptions.get(organizationId) || [];
        const prescription = orginscriptions.find((p) => p.id === refill.prescriptionId);

        if (prescription && refill.requestedPharmacyId) {
          prescription.fillHistory.push({
            fillDate: filledDate || new Date(),
            pharmacyId: refill.requestedPharmacyId,
            pharmacyName: `Pharmacy ${refill.requestedPharmacyId.slice(0, 4)}`,
            filledQuantity: prescription.quantity,
            refillsRemaining: prescription.refills - 1,
          });

          if (prescription.refills > 0) {
            prescription.refills--;
          } else {
            prescription.status = 'filled';
          }
        }
      }

      await logAudit(null, AuditAction.SETTINGS_UPDATED, 'REFILL_STATUS_UPDATED', refillId, {
        status: 'SUCCESS',
        details: { newStatus: status },
      });
    }

    return refill || null;
  }

  static async checkDrugInteractions(
    organizationId: string,
    patientId: string,
    prescriptionId: string,
    currentMedications: string[]
  ): Promise<DrugInteractionCheck> {
    const checkId = `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Simulate interaction checking
    const interactions: Array<{
      severity: 'mild' | 'moderate' | 'severe';
      interaction: string;
      recommendation: string;
    }> = [];

    // Mock: Random 20% chance of interaction
    if (Math.random() < 0.2) {
      interactions.push({
        severity: 'moderate',
        interaction: 'May increase bleeding risk',
        recommendation: 'Monitor for signs of bleeding. May require INR monitoring.',
      });
    }

    const check: DrugInteractionCheck = {
      id: checkId,
      organizationId,
      patientId,
      prescriptionId,
      otherMedications: currentMedications,
      timestamp: new Date(),
      interactions,
    };

    if (!interactionChecks.has(organizationId)) {
      interactionChecks.set(organizationId, []);
    }

    interactionChecks.get(organizationId)!.push(check);

    if (interactions.length > 0) {
      await logAudit(null, AuditAction.SETTINGS_UPDATED, 'DRUG_INTERACTION_DETECTED', checkId, {
        status: 'ALERT',
        details: { patientId, interactionCount: interactions.length },
      });
    }

    return check;
  }

  static async addPharmacyToNetwork(
    organizationId: string,
    pharmacyId: string,
    pharmacyName: string,
    address: string,
    city: string,
    state: string,
    zipCode: string,
    phoneNumber: string,
    deliveryAvailable: boolean = false
  ): Promise<PharmacyNetwork> {
    const networkId = `network_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const pharmacy: PharmacyNetwork = {
      id: networkId,
      organizationId,
      pharmacyId,
      pharmacyName,
      address,
      city,
      state,
      zipCode,
      phoneNumber,
      serviceHours: '9AM-9PM',
      distanceFromPatient: Math.random() * 10, // Mock distance
      acceptsInsurance: true,
      deliveryAvailable,
    };

    if (!pharmacyNetworks.has(organizationId)) {
      pharmacyNetworks.set(organizationId, []);
    }

    pharmacyNetworks.get(organizationId)!.push(pharmacy);

    return pharmacy;
  }

  static async getPrescriptions(organizationId: string, patientId: string): Promise<Prescription[]> {
    const orginscriptions = prescriptions.get(organizationId) || [];
    return orginscriptions.filter((p) => p.patientId === patientId);
  }

  static async getPharmacyNetwork(organizationId: string): Promise<PharmacyNetwork[]> {
    return pharmacyNetworks.get(organizationId) || [];
  }

  static async getRefillRequests(
    organizationId: string,
    patientId?: string,
    status?: string
  ): Promise<RefillRequest[]> {
    let refills = refillRequests.get(organizationId) || [];

    if (patientId) {
      refills = refills.filter((r) => r.patientId === patientId);
    }

    if (status) {
      refills = refills.filter((r) => r.status === status);
    }

    return refills;
  }

  static async getPharmacyMetrics(organizationId: string): Promise<{
    totalPrescriptions: number;
    activePrescriptions: number;
    totalRefills: number;
    averageRefillTime: number;
    interactionAlertsCount: number;
  }> {
    const orginscriptions = prescriptions.get(organizationId) || [];
    const refills = refillRequests.get(organizationId) || [];
    const interactions = interactionChecks.get(organizationId) || [];

    const activePrescriptions = orginscriptions.filter((p) => p.status === 'active').length;
    const filledRefills = refills.filter((r) => r.status === 'filled');

    const avgRefillTime =
      filledRefills.length > 0
        ? filledRefills.reduce((sum, r) => sum + (r.filledDate ? 1 : 0), 0) / filledRefills.length
        : 0;

    return {
      totalPrescriptions: orginscriptions.length,
      activePrescriptions,
      totalRefills: refills.length,
      averageRefillTime: Math.round(avgRefillTime * 24 * 100) / 100, // Convert to hours
      interactionAlertsCount: interactions.filter((i) => i.interactions.length > 0).length,
    };
  }

  static async disablePharmacyConfig(pharmacyConfigId: string): Promise<void> {
    const config = pharmacyConfigs.get(pharmacyConfigId);
    if (config) {
      config.enabled = false;
      config.updatedAt = new Date();
    }

    await logAudit(null, AuditAction.SETTINGS_UPDATED, 'PHARMACY_CONFIG_DISABLED', pharmacyConfigId, {
      status: 'SUCCESS',
      details: {},
    });
  }
}
