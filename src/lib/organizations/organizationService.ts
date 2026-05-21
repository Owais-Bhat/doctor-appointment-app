/**
 * Organization Service
 *
 * Manage clinics, practices, and healthcare organizations
 * Multi-tenant architecture with organization isolation
 */

import { invalidateCacheTag, CacheTags } from '@/lib/cache/cacheManager';
import { logAuditEvent } from '@/lib/audit/logger';

/**
 * Organization
 */
export interface Organization {
  organizationId: string;
  name: string;
  type: 'solo_practice' | 'group_practice' | 'hospital' | 'clinic_network' | 'healthcare_system';
  parentOrganizationId?: string; // For sub-organizations
  legalName: string;
  ein: string; // Employer Identification Number
  npi: string; // National Provider Identifier
  website?: string;
  phone: string;
  email: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  logo?: string;
  branding: {
    primaryColor: string;
    secondaryColor: string;
    customDomain?: string;
  };
  settings: {
    appointmentDuration: number; // in minutes
    bufferTime: number;
    allowOnlineBooking: boolean;
    requireInsuranceVerification: boolean;
    enableTelehealth: boolean;
    enableVideoRecording: boolean;
    maxConcurrentAppointments: number;
  };
  billingInfo: {
    stripeAccountId?: string;
    taxRate: number;
    currency: string;
    paymentMethods: string[];
  };
  complianceInfo: {
    hipaaCompliant: boolean;
    gdprCompliant: boolean;
    ccpaCompliant: boolean;
    certifications: string[];
    lastAuditDate?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'inactive' | 'suspended';
  subscriptionPlan: 'starter' | 'professional' | 'enterprise' | 'custom';
  subscriptionStatus: 'active' | 'trial' | 'paused' | 'cancelled';
}

/**
 * Clinic (location within organization)
 */
export interface Clinic {
  clinicId: string;
  organizationId: string;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  phone: string;
  fax?: string;
  email: string;
  managerId: string;
  operatingHours: {
    monday: { open: string; close: string };
    tuesday: { open: string; close: string };
    wednesday: { open: string; close: string };
    thursday: { open: string; close: string };
    friday: { open: string; close: string };
    saturday?: { open: string; close: string };
    sunday?: { open: string; close: string };
  };
  departments: string[];
  capacity: number; // max concurrent appointments
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'inactive';
}

/**
 * Organization service
 */
export class OrganizationService {
  private organizations: Map<string, Organization> = new Map();
  private clinics: Map<string, Clinic> = new Map();

  /**
   * Create organization
   */
  async createOrganization(
    data: Omit<Organization, 'organizationId' | 'createdAt' | 'updatedAt'>,
    userId: string,
    ipAddress: string
  ): Promise<Organization> {
    const organizationId = `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const organization: Organization = {
      organizationId,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.organizations.set(organizationId, organization);

    // Log event
    await logAuditEvent({
      action: 'ORGANIZATION_CREATED',
      resourceType: 'organization',
      resourceId: organizationId,
      userId,
      ipAddress,
      details: {
        name: data.name,
        type: data.type,
      },
    });

    console.log(`[ORG] Created: ${organizationId}`);

    return organization;
  }

  /**
   * Get organization
   */
  async getOrganization(
    organizationId: string,
    userId: string
  ): Promise<Organization | null> {
    return this.organizations.get(organizationId) || null;
  }

  /**
   * Update organization
   */
  async updateOrganization(
    organizationId: string,
    updates: Partial<Organization>,
    userId: string,
    ipAddress: string
  ): Promise<Organization> {
    const organization = this.organizations.get(organizationId);

    if (!organization) {
      throw new Error('Organization not found');
    }

    Object.assign(organization, updates, { updatedAt: new Date() });

    // Log event
    await logAuditEvent({
      action: 'ORGANIZATION_UPDATED',
      resourceType: 'organization',
      resourceId: organizationId,
      userId,
      ipAddress,
      details: Object.keys(updates),
    });

    invalidateCacheTag(CacheTags.PROFILE);

    console.log(`[ORG] Updated: ${organizationId}`);

    return organization;
  }

  /**
   * Create clinic
   */
  async createClinic(
    organizationId: string,
    data: Omit<Clinic, 'clinicId' | 'organizationId' | 'createdAt' | 'updatedAt'>,
    userId: string,
    ipAddress: string
  ): Promise<Clinic> {
    const organization = this.organizations.get(organizationId);
    if (!organization) {
      throw new Error('Organization not found');
    }

    const clinicId = `clinic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const clinic: Clinic = {
      clinicId,
      organizationId,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.clinics.set(clinicId, clinic);

    // Log event
    await logAuditEvent({
      action: 'CLINIC_CREATED',
      resourceType: 'clinic',
      resourceId: clinicId,
      userId,
      ipAddress,
      details: {
        organizationId,
        name: data.name,
      },
    });

    console.log(`[CLINIC] Created: ${clinicId}`);

    return clinic;
  }

  /**
   * Get clinic
   */
  async getClinic(clinicId: string): Promise<Clinic | null> {
    return this.clinics.get(clinicId) || null;
  }

  /**
   * Get organization clinics
   */
  async getOrganizationClinics(organizationId: string): Promise<Clinic[]> {
    const clinics: Clinic[] = [];

    for (const clinic of this.clinics.values()) {
      if (clinic.organizationId === organizationId) {
        clinics.push(clinic);
      }
    }

    return clinics;
  }

  /**
   * Update clinic
   */
  async updateClinic(
    clinicId: string,
    updates: Partial<Clinic>,
    userId: string,
    ipAddress: string
  ): Promise<Clinic> {
    const clinic = this.clinics.get(clinicId);

    if (!clinic) {
      throw new Error('Clinic not found');
    }

    Object.assign(clinic, updates, { updatedAt: new Date() });

    // Log event
    await logAuditEvent({
      action: 'CLINIC_UPDATED',
      resourceType: 'clinic',
      resourceId: clinicId,
      userId,
      ipAddress,
    });

    console.log(`[CLINIC] Updated: ${clinicId}`);

    return clinic;
  }

  /**
   * Get organization stats
   */
  getOrganizationStats(organizationId: string) {
    const clinics = Array.from(this.clinics.values()).filter(
      c => c.organizationId === organizationId
    );

    return {
      organizationId,
      clinicCount: clinics.length,
      totalCapacity: clinics.reduce((sum, c) => sum + c.capacity, 0),
      activeClinics: clinics.filter(c => c.status === 'active').length,
    };
  }

  /**
   * List organizations (admin)
   */
  async listOrganizations(status?: string): Promise<Organization[]> {
    const organizations: Organization[] = [];

    for (const org of this.organizations.values()) {
      if (status && org.status !== status) {
        continue;
      }
      organizations.push(org);
    }

    return organizations;
  }

  /**
   * Suspend organization
   */
  async suspendOrganization(
    organizationId: string,
    reason: string,
    userId: string,
    ipAddress: string
  ): Promise<Organization> {
    const organization = this.organizations.get(organizationId);

    if (!organization) {
      throw new Error('Organization not found');
    }

    organization.status = 'suspended';
    organization.updatedAt = new Date();

    // Log event
    await logAuditEvent({
      action: 'ORGANIZATION_SUSPENDED',
      resourceType: 'organization',
      resourceId: organizationId,
      userId,
      ipAddress,
      details: { reason },
    });

    console.log(`[ORG] Suspended: ${organizationId}`);

    return organization;
  }

  /**
   * Get organization stats
   */
  getStats() {
    return {
      totalOrganizations: this.organizations.size,
      totalClinics: this.clinics.size,
      activeOrganizations: Array.from(this.organizations.values()).filter(
        o => o.status === 'active'
      ).length,
      organizationsByType: this.getOrganizationsByType(),
    };
  }

  /**
   * Get organizations by type
   */
  private getOrganizationsByType() {
    const types: Record<string, number> = {};

    for (const org of this.organizations.values()) {
      types[org.type] = (types[org.type] || 0) + 1;
    }

    return types;
  }
}

/**
 * Global service instance
 */
export const organizationService = new OrganizationService();
