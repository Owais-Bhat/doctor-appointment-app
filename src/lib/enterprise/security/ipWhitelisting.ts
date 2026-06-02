/**
 * IP Whitelisting Service
 * Restrict access to specific IP addresses or ranges
 */

import { logAudit, AuditAction } from '@/lib/audit/logger';

interface IPWhitelistRule {
  id: string;
  organizationId: string;
  ipAddress: string;
  ipRange?: string; // CIDR notation
  description: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface IPAccessLog {
  id: string;
  organizationId: string;
  ipAddress: string;
  allowed: boolean;
  timestamp: Date;
  userId?: string;
  userAgent: string;
}

const whitelistRules = new Map<string, IPWhitelistRule>();
const accessLogs = new Map<string, IPAccessLog[]>();

export class IPWhitelistingService {
  static async addIPToWhitelist(
    organizationId: string,
    ipAddress: string,
    description: string,
    ipRange?: string
  ): Promise<IPWhitelistRule> {
    const id = `ip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const rule: IPWhitelistRule = {
      id,
      organizationId,
      ipAddress,
      ipRange,
      description,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    };

    whitelistRules.set(id, rule);

    await logAudit(null, AuditAction.SETTINGS_UPDATED, 'IP_WHITELIST', id, {
      status: 'SUCCESS',
      details: { organizationId, ipAddress, ipRange },
    });

    return rule;
  }

  static async removeIPFromWhitelist(ruleId: string): Promise<void> {
    whitelistRules.delete(ruleId);

    await logAudit(null, AuditAction.SETTINGS_UPDATED, 'IP_WHITELIST', ruleId, {
      status: 'SUCCESS',
      details: { operation: 'removed' },
    });
  }

  static async getWhitelistRules(organizationId: string): Promise<IPWhitelistRule[]> {
    return Array.from(whitelistRules.values()).filter(
      (r) => r.organizationId === organizationId && r.enabled
    );
  }

  static async checkIPAccess(
    organizationId: string,
    ipAddress: string,
    userId?: string,
    userAgent?: string
  ): Promise<boolean> {
    const rules = await this.getWhitelistRules(organizationId);

    // If no rules, allow all
    if (rules.length === 0) {
      await this.logIPAccess(organizationId, ipAddress, true, userId, userAgent);
      return true;
    }

    // Check if IP matches any rule
    const allowed = rules.some((rule) => this.isIPInRange(ipAddress, rule));

    await this.logIPAccess(organizationId, ipAddress, allowed, userId, userAgent);

    return allowed;
  }

  static async logIPAccess(
    organizationId: string,
    ipAddress: string,
    allowed: boolean,
    userId?: string,
    userAgent?: string
  ): Promise<void> {
    const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const log: IPAccessLog = {
      id: logId,
      organizationId,
      ipAddress,
      allowed,
      timestamp: new Date(),
      userId,
      userAgent: userAgent || '',
    };

    if (!accessLogs.has(organizationId)) {
      accessLogs.set(organizationId, []);
    }

    accessLogs.get(organizationId)!.push(log);

    if (!allowed) {
      await logAudit(userId || null, AuditAction.UNAUTHORIZED_ACCESS_ATTEMPT, 'IP_BLOCKED', logId, {
        status: 'FAILURE',
        ipAddress,
        details: { organization: organizationId },
      });
    }
  }

  static async getAccessLogs(
    organizationId: string,
    limit: number = 100,
    onlyDenied: boolean = false
  ): Promise<IPAccessLog[]> {
    const logs = accessLogs.get(organizationId) || [];
    let filtered = logs;

    if (onlyDenied) {
      filtered = logs.filter((l) => !l.allowed);
    }

    return filtered.slice(-limit);
  }

  static async enableWhitelistRule(ruleId: string): Promise<void> {
    const rule = whitelistRules.get(ruleId);
    if (rule) {
      rule.enabled = true;
      rule.updatedAt = new Date();
    }
  }

  static async disableWhitelistRule(ruleId: string): Promise<void> {
    const rule = whitelistRules.get(ruleId);
    if (rule) {
      rule.enabled = false;
      rule.updatedAt = new Date();
    }
  }

  static async updateWhitelistRule(
    ruleId: string,
    updates: Partial<IPWhitelistRule>
  ): Promise<IPWhitelistRule | null> {
    const rule = whitelistRules.get(ruleId);
    if (!rule) return null;

    Object.assign(rule, updates, { updatedAt: new Date() });
    return rule;
  }

  private static isIPInRange(ipAddress: string, rule: IPWhitelistRule): boolean {
    // Exact match
    if (ipAddress === rule.ipAddress) {
      return true;
    }

    // CIDR range match
    if (rule.ipRange) {
      return this.isIPInCIDR(ipAddress, rule.ipRange);
    }

    return false;
  }

  private static isIPInCIDR(ipAddress: string, cidr: string): boolean {
    // Simplified CIDR check - in production use a library like ip
    const [network, bitsStr] = cidr.split('/');
    const bits = parseInt(bitsStr, 10);

    // Very simplified - just check prefix
    const ipParts = ipAddress.split('.');
    const networkParts = network.split('.');

    const bytesToCheck = Math.ceil(bits / 8);
    for (let i = 0; i < bytesToCheck; i++) {
      if (ipParts[i] !== networkParts[i]) {
        return false;
      }
    }

    return true;
  }

  static async getDeniedIPs(organizationId: string, hours: number = 24): Promise<string[]> {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const logs = accessLogs.get(organizationId) || [];

    return [
      ...new Set(
        logs
          .filter((l) => !l.allowed && l.timestamp > cutoff)
          .map((l) => l.ipAddress)
      ),
    ];
  }

  static async getAccessStatistics(organizationId: string): Promise<{
    totalAttempts: number;
    allowedAttempts: number;
    deniedAttempts: number;
    uniqueIPs: number;
    deniedIPs: number;
  }> {
    const logs = accessLogs.get(organizationId) || [];

    const totalAttempts = logs.length;
    const allowedAttempts = logs.filter((l) => l.allowed).length;
    const deniedAttempts = logs.filter((l) => !l.allowed).length;

    const uniqueIPs = new Set(logs.map((l) => l.ipAddress)).size;
    const deniedIPs = new Set(logs.filter((l) => !l.allowed).map((l) => l.ipAddress)).size;

    return {
      totalAttempts,
      allowedAttempts,
      deniedAttempts,
      uniqueIPs,
      deniedIPs,
    };
  }
}
