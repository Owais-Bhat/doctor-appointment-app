/**
 * Staff Service
 *
 * Manage staff members, roles, permissions, and credentials
 */

import { logAuditEvent } from '@/lib/audit/logger';

/**
 * Staff member
 */
export interface StaffMember {
  staffId: string;
  organizationId: string;
  clinicId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'admin' | 'manager' | 'doctor' | 'nurse' | 'staff' | 'billing' | 'support';
  department?: string;
  credentials: {
    licenseNumber?: string;
    licensedState?: string;
    npi?: string;
    degree?: string;
    specialization?: string;
    certifications: string[];
  };
  permissions: string[];
  schedule: {
    monday?: { start: string; end: string };
    tuesday?: { start: string; end: string };
    wednesday?: { start: string; end: string };
    thursday?: { start: string; end: string };
    friday?: { start: string; end: string };
    saturday?: { start: string; end: string };
    sunday?: { start: string; end: string };
  };
  status: 'active' | 'inactive' | 'suspended' | 'terminated';
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Role definition
 */
export interface RoleDefinition {
  roleId: string;
  organizationId: string;
  name: string;
  description: string;
  permissions: string[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Permission
 */
export const PERMISSIONS = {
  // Organization
  'org:view': 'View organization',
  'org:edit': 'Edit organization',
  'org:manage': 'Manage organization',

  // Clinic
  'clinic:view': 'View clinics',
  'clinic:create': 'Create clinics',
  'clinic:edit': 'Edit clinics',
  'clinic:manage': 'Manage clinics',

  // Staff
  'staff:view': 'View staff',
  'staff:create': 'Create staff',
  'staff:edit': 'Edit staff',
  'staff:manage': 'Manage staff',
  'staff:suspend': 'Suspend staff',

  // Appointments
  'appointments:view': 'View appointments',
  'appointments:create': 'Create appointments',
  'appointments:edit': 'Edit appointments',
  'appointments:cancel': 'Cancel appointments',

  // Medical Records
  'records:view': 'View medical records',
  'records:create': 'Create medical records',
  'records:edit': 'Edit medical records',
  'records:delete': 'Delete medical records',

  // Prescriptions
  'prescriptions:view': 'View prescriptions',
  'prescriptions:create': 'Create prescriptions',
  'prescriptions:approve': 'Approve prescriptions',

  // Payments
  'payments:view': 'View payments',
  'payments:process': 'Process payments',
  'payments:refund': 'Process refunds',

  // Reports
  'reports:view': 'View reports',
  'reports:create': 'Create reports',
  'reports:export': 'Export reports',

  // Analytics
  'analytics:view': 'View analytics',
  'analytics:admin': 'Admin analytics',

  // Settings
  'settings:view': 'View settings',
  'settings:edit': 'Edit settings',
  'settings:manage': 'Manage settings',
};

/**
 * Role-based default permissions
 */
export const ROLE_DEFAULTS: Record<string, string[]> = {
  admin: Object.keys(PERMISSIONS),
  manager: [
    'org:view',
    'clinic:view',
    'clinic:edit',
    'staff:view',
    'appointments:view',
    'appointments:create',
    'appointments:edit',
    'records:view',
    'payments:view',
    'reports:view',
    'analytics:view',
    'settings:view',
    'settings:edit',
  ],
  doctor: [
    'org:view',
    'appointments:view',
    'appointments:create',
    'appointments:edit',
    'appointments:cancel',
    'records:view',
    'records:create',
    'records:edit',
    'prescriptions:view',
    'prescriptions:create',
    'prescriptions:approve',
    'reports:view',
    'analytics:view',
  ],
  nurse: [
    'appointments:view',
    'records:view',
    'records:create',
    'prescriptions:view',
  ],
  staff: [
    'appointments:view',
    'records:view',
  ],
  billing: [
    'payments:view',
    'payments:process',
    'payments:refund',
    'reports:view',
  ],
  support: [
    'appointments:view',
    'records:view',
  ],
};

/**
 * Staff service
 */
export class StaffService {
  private staff: Map<string, StaffMember> = new Map();
  private roles: Map<string, RoleDefinition> = new Map();

  /**
   * Create staff member
   */
  async createStaffMember(
    organizationId: string,
    data: Omit<StaffMember, 'staffId' | 'createdAt' | 'updatedAt'>,
    userId: string,
    ipAddress: string
  ): Promise<StaffMember> {
    const staffId = `staff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const member: StaffMember = {
      staffId,
      ...data,
      permissions: data.permissions || ROLE_DEFAULTS[data.role] || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.staff.set(staffId, member);

    // Log event
    await logAuditEvent({
      action: 'STAFF_CREATED',
      resourceType: 'staff',
      resourceId: staffId,
      userId,
      ipAddress,
      details: {
        organizationId,
        role: data.role,
        email: data.email,
      },
    });

    console.log(`[STAFF] Created: ${staffId}`);

    return member;
  }

  /**
   * Get staff member
   */
  async getStaffMember(staffId: string): Promise<StaffMember | null> {
    return this.staff.get(staffId) || null;
  }

  /**
   * Update staff member
   */
  async updateStaffMember(
    staffId: string,
    updates: Partial<StaffMember>,
    userId: string,
    ipAddress: string
  ): Promise<StaffMember> {
    const member = this.staff.get(staffId);

    if (!member) {
      throw new Error('Staff member not found');
    }

    Object.assign(member, updates, { updatedAt: new Date() });

    // Log event
    await logAuditEvent({
      action: 'STAFF_UPDATED',
      resourceType: 'staff',
      resourceId: staffId,
      userId,
      ipAddress,
    });

    console.log(`[STAFF] Updated: ${staffId}`);

    return member;
  }

  /**
   * Get organization staff
   */
  async getOrganizationStaff(organizationId: string, role?: string): Promise<StaffMember[]> {
    const staffMembers: StaffMember[] = [];

    for (const member of this.staff.values()) {
      if (member.organizationId === organizationId) {
        if (role && member.role !== role) {
          continue;
        }
        staffMembers.push(member);
      }
    }

    return staffMembers;
  }

  /**
   * Get staff by clinic
   */
  async getClinicStaff(clinicId: string): Promise<StaffMember[]> {
    const staffMembers: StaffMember[] = [];

    for (const member of this.staff.values()) {
      if (member.clinicId === clinicId && member.status === 'active') {
        staffMembers.push(member);
      }
    }

    return staffMembers;
  }

  /**
   * Check permission
   */
  hasPermission(staffId: string, permission: string): boolean {
    const member = this.staff.get(staffId);

    if (!member) {
      return false;
    }

    return member.permissions.includes(permission);
  }

  /**
   * Suspend staff
   */
  async suspendStaffMember(
    staffId: string,
    reason: string,
    userId: string,
    ipAddress: string
  ): Promise<StaffMember> {
    const member = this.staff.get(staffId);

    if (!member) {
      throw new Error('Staff member not found');
    }

    member.status = 'suspended';
    member.updatedAt = new Date();

    // Log event
    await logAuditEvent({
      action: 'STAFF_SUSPENDED',
      resourceType: 'staff',
      resourceId: staffId,
      userId,
      ipAddress,
      details: { reason },
    });

    console.log(`[STAFF] Suspended: ${staffId}`);

    return member;
  }

  /**
   * Terminate staff
   */
  async terminateStaffMember(
    staffId: string,
    reason: string,
    userId: string,
    ipAddress: string
  ): Promise<StaffMember> {
    const member = this.staff.get(staffId);

    if (!member) {
      throw new Error('Staff member not found');
    }

    member.status = 'terminated';
    member.endDate = new Date();
    member.updatedAt = new Date();

    // Log event
    await logAuditEvent({
      action: 'STAFF_TERMINATED',
      resourceType: 'staff',
      resourceId: staffId,
      userId,
      ipAddress,
      details: { reason },
    });

    console.log(`[STAFF] Terminated: ${staffId}`);

    return member;
  }

  /**
   * Create role
   */
  async createRole(
    organizationId: string,
    data: Omit<RoleDefinition, 'roleId' | 'createdAt' | 'updatedAt'>,
    userId: string,
    ipAddress: string
  ): Promise<RoleDefinition> {
    const roleId = `role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const role: RoleDefinition = {
      roleId,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.roles.set(roleId, role);

    // Log event
    await logAuditEvent({
      action: 'ROLE_CREATED',
      resourceType: 'role',
      resourceId: roleId,
      userId,
      ipAddress,
      details: { organizationId, roleName: data.name },
    });

    console.log(`[STAFF] Role created: ${roleId}`);

    return role;
  }

  /**
   * Get role
   */
  async getRole(roleId: string): Promise<RoleDefinition | null> {
    return this.roles.get(roleId) || null;
  }

  /**
   * Get organization roles
   */
  async getOrganizationRoles(organizationId: string): Promise<RoleDefinition[]> {
    const roles: RoleDefinition[] = [];

    for (const role of this.roles.values()) {
      if (role.organizationId === organizationId) {
        roles.push(role);
      }
    }

    return roles;
  }

  /**
   * Assign role permissions
   */
  async assignPermissions(
    staffId: string,
    permissions: string[],
    userId: string,
    ipAddress: string
  ): Promise<StaffMember> {
    const member = this.staff.get(staffId);

    if (!member) {
      throw new Error('Staff member not found');
    }

    member.permissions = [...new Set(permissions)];
    member.updatedAt = new Date();

    // Log event
    await logAuditEvent({
      action: 'PERMISSIONS_ASSIGNED',
      resourceType: 'staff',
      resourceId: staffId,
      userId,
      ipAddress,
      details: { permissionCount: permissions.length },
    });

    console.log(`[STAFF] Permissions updated: ${staffId}`);

    return member;
  }

  /**
   * Get staff stats
   */
  getStats(organizationId?: string) {
    let filtered = Array.from(this.staff.values());

    if (organizationId) {
      filtered = filtered.filter(s => s.organizationId === organizationId);
    }

    return {
      totalStaff: filtered.length,
      activeStaff: filtered.filter(s => s.status === 'active').length,
      staffByRole: this.getStaffByRole(filtered),
      totalRoles: this.roles.size,
    };
  }

  /**
   * Get staff by role
   */
  private getStaffByRole(staff: StaffMember[]) {
    const counts: Record<string, number> = {};

    for (const member of staff) {
      counts[member.role] = (counts[member.role] || 0) + 1;
    }

    return counts;
  }
}

/**
 * Global service instance
 */
export const staffService = new StaffService();
