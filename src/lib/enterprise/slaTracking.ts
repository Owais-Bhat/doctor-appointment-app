/**
 * SLA Tracking Service
 * Monitor service level agreements and uptime guarantees
 */

import { logAudit, AuditAction } from '@/lib/audit/logger';

interface SLA {
  id: string;
  organizationId: string;
  name: string;
  uptime: number; // 99.9, 99.99, etc.
  responseTimeMs: number; // max response time
  resolutionTimeHours: number; // time to resolve issues
  monthlyDowntimeAllowedMs: number; // calculated from uptime
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface SLAMetric {
  id: string;
  organizationId: string;
  slaId: string;
  timestamp: Date;
  responseTimeMs: number;
  isSuccessful: boolean;
  endpointPath: string;
  statusCode: number;
}

interface SLAStatus {
  organizationId: string;
  slaId: string;
  currentUptime: number;
  downtimeMs: number;
  monthlyDowntimeAllowedMs: number;
  breached: boolean;
  avgResponseTimeMs: number;
  errorRate: number;
  requestsInWindow: number;
  failedRequests: number;
}

const slaConfigs = new Map<string, SLA>();
const slaMetrics = new Map<string, SLAMetric[]>();
const slaBreaches = new Map<string, { timestamp: Date; slaId: string; reason: string }[]>();

export class SLATrackingService {
  static calculateMonthlyDowntimeAllowed(uptime: number): number {
    // 99.9% uptime = 43.2 minutes/month downtime
    const monthMinutes = 30 * 24 * 60;
    return (monthMinutes * (100 - uptime)) / 100 * 60 * 1000; // convert to ms
  }

  static async createSLA(
    organizationId: string,
    name: string,
    uptime: number,
    responseTimeMs: number,
    resolutionTimeHours: number
  ): Promise<SLA> {
    const id = `sla_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const sla: SLA = {
      id,
      organizationId,
      name,
      uptime,
      responseTimeMs,
      resolutionTimeHours,
      monthlyDowntimeAllowedMs: this.calculateMonthlyDowntimeAllowed(uptime),
      enabled: true,
      createdAt: now,
      updatedAt: now,
    };

    slaConfigs.set(id, sla);

    await logAudit(null, AuditAction.SETTINGS_UPDATED, 'SLA_CREATED', id, {
      status: 'SUCCESS',
      details: { organizationId, name, uptime },
    });

    return sla;
  }

  static async getSLA(slaId: string): Promise<SLA | undefined> {
    return slaConfigs.get(slaId);
  }

  static async getOrganizationSLAs(organizationId: string): Promise<SLA[]> {
    return Array.from(slaConfigs.values()).filter(
      (sla) => sla.organizationId === organizationId && sla.enabled
    );
  }

  static async recordMetric(
    organizationId: string,
    slaId: string,
    responseTimeMs: number,
    isSuccessful: boolean,
    endpointPath: string,
    statusCode: number
  ): Promise<void> {
    const metricId = `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const metric: SLAMetric = {
      id: metricId,
      organizationId,
      slaId,
      timestamp: new Date(),
      responseTimeMs,
      isSuccessful,
      endpointPath,
      statusCode,
    };

    if (!slaMetrics.has(organizationId)) {
      slaMetrics.set(organizationId, []);
    }

    slaMetrics.get(organizationId)!.push(metric);

    // Check for SLA breach
    const sla = await this.getSLA(slaId);
    if (sla && responseTimeMs > sla.responseTimeMs) {
      await this.recordBreach(organizationId, slaId, 'Response time exceeded');
    }
  }

  static async recordBreach(
    organizationId: string,
    slaId: string,
    reason: string
  ): Promise<void> {
    if (!slaBreaches.has(organizationId)) {
      slaBreaches.set(organizationId, []);
    }

    slaBreaches.get(organizationId)!.push({
      timestamp: new Date(),
      slaId,
      reason,
    });

    await logAudit(null, AuditAction.SLA_BREACH_DETECTED, 'SLA_BREACH', slaId, {
      status: 'ALERT',
      details: { organizationId, reason },
    });
  }

  static async getSLAStatus(organizationId: string, slaId: string): Promise<SLAStatus | null> {
    const sla = await this.getSLA(slaId);
    if (!sla || sla.organizationId !== organizationId) {
      return null;
    }

    const metrics = slaMetrics.get(organizationId) || [];
    const slaSpecificMetrics = metrics.filter((m) => m.slaId === slaId);

    // Look at last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentMetrics = slaSpecificMetrics.filter((m) => m.timestamp > thirtyDaysAgo);

    const failedRequests = recentMetrics.filter((m) => !m.isSuccessful).length;
    const downtimeMs = recentMetrics
      .filter((m) => !m.isSuccessful)
      .reduce((sum, m) => sum + m.responseTimeMs, 0);

    const avgResponseTimeMs =
      recentMetrics.length > 0
        ? recentMetrics.reduce((sum, m) => sum + m.responseTimeMs, 0) / recentMetrics.length
        : 0;

    const errorRate =
      recentMetrics.length > 0 ? (failedRequests / recentMetrics.length) * 100 : 0;

    const totalMonthMs = 30 * 24 * 60 * 60 * 1000;
    const uptimePercent = ((totalMonthMs - downtimeMs) / totalMonthMs) * 100;
    const breached = downtimeMs > sla.monthlyDowntimeAllowedMs;

    return {
      organizationId,
      slaId,
      currentUptime: Math.round(uptimePercent * 10) / 10,
      downtimeMs,
      monthlyDowntimeAllowedMs: sla.monthlyDowntimeAllowedMs,
      breached,
      avgResponseTimeMs: Math.round(avgResponseTimeMs),
      errorRate: Math.round(errorRate * 100) / 100,
      requestsInWindow: recentMetrics.length,
      failedRequests,
    };
  }

  static async getBreaches(organizationId: string, days: number = 30): Promise<any[]> {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const breaches = slaBreaches.get(organizationId) || [];

    return breaches.filter((b) => b.timestamp > cutoff);
  }

  static async updateSLA(slaId: string, updates: Partial<SLA>): Promise<SLA | null> {
    const sla = slaConfigs.get(slaId);
    if (!sla) return null;

    Object.assign(sla, updates, { updatedAt: new Date() });
    return sla;
  }

  static async disableSLA(slaId: string): Promise<void> {
    const sla = slaConfigs.get(slaId);
    if (sla) {
      sla.enabled = false;
      sla.updatedAt = new Date();
    }

    await logAudit(null, AuditAction.SETTINGS_UPDATED, 'SLA_DISABLED', slaId, {
      status: 'SUCCESS',
      details: {},
    });
  }

  static async getMetricsForEndpoint(
    organizationId: string,
    endpointPath: string,
    hours: number = 24
  ): Promise<SLAMetric[]> {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const metrics = slaMetrics.get(organizationId) || [];

    return metrics.filter((m) => m.endpointPath === endpointPath && m.timestamp > cutoff);
  }

  static async generateSLAReport(organizationId: string): Promise<{
    totalSLAs: number;
    activeSLAs: number;
    breachedSLAs: number;
    avgUptime: number;
    recentBreaches: number;
  }> {
    const slas = await this.getOrganizationSLAs(organizationId);
    const breaches = await this.getBreaches(organizationId, 7);

    let breachedCount = 0;
    let totalUptime = 0;

    for (const sla of slas) {
      const status = await this.getSLAStatus(organizationId, sla.id);
      if (status && status.breached) breachedCount++;
      if (status) totalUptime += status.currentUptime;
    }

    return {
      totalSLAs: slas.length,
      activeSLAs: slas.filter((s) => s.enabled).length,
      breachedSLAs: breachedCount,
      avgUptime: slas.length > 0 ? Math.round((totalUptime / slas.length) * 100) / 100 : 0,
      recentBreaches: breaches.length,
    };
  }
}
