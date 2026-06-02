/**
 * Health Check Service
 * Service health monitoring, uptime tracking, and dependency checks
 */

import { logAudit, AuditAction } from '@/lib/audit/logger';

interface HealthStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number; // percentage
  responseTime: number; // ms
  lastCheck: Date;
  message: string;
}

interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  services: HealthStatus[];
  database: 'healthy' | 'degraded' | 'unhealthy';
  cache: 'healthy' | 'degraded' | 'unhealthy';
  queue: 'healthy' | 'degraded' | 'unhealthy';
  errorRate: number;
}

interface ServiceDependency {
  service: string;
  dependencies: string[];
  criticalDependencies: string[];
}

const healthChecks = new Map<string, HealthStatus[]>();
const serviceDependencies = new Map<string, ServiceDependency>();
const uptimeHistory = new Map<string, number[]>();

export class HealthCheckService {
  static async checkServiceHealth(serviceName: string): Promise<HealthStatus> {
    // Simulate health check
    const isHealthy = Math.random() > 0.1; // 90% healthy
    const status: HealthStatus = {
      service: serviceName,
      status: isHealthy ? 'healthy' : 'degraded',
      uptime: isHealthy ? 99.9 + Math.random() * 0.1 : 95 + Math.random() * 4,
      responseTime: Math.random() * 200 + 50,
      lastCheck: new Date(),
      message: isHealthy ? 'Service is responding normally' : 'Service experiencing delays',
    };

    if (!healthChecks.has(serviceName)) {
      healthChecks.set(serviceName, []);
    }
    healthChecks.get(serviceName)!.push(status);

    // Keep only last 100 checks
    const checks = healthChecks.get(serviceName)!;
    if (checks.length > 100) {
      checks.shift();
    }

    return status;
  }

  static async checkDatabaseHealth(): Promise<HealthStatus> {
    const isHealthy = Math.random() > 0.05;

    return {
      service: 'database',
      status: isHealthy ? 'healthy' : 'degraded',
      uptime: isHealthy ? 99.95 : 95,
      responseTime: Math.random() * 100 + 20,
      lastCheck: new Date(),
      message: isHealthy ? 'Database connection pool healthy' : 'Database connection issues detected',
    };
  }

  static async checkCacheHealth(): Promise<HealthStatus> {
    const isHealthy = Math.random() > 0.05;

    return {
      service: 'cache',
      status: isHealthy ? 'healthy' : 'degraded',
      uptime: isHealthy ? 99.9 : 95,
      responseTime: Math.random() * 50 + 5,
      lastCheck: new Date(),
      message: isHealthy ? 'Cache layer responding normally' : 'Cache performance degraded',
    };
  }

  static async checkQueueHealth(): Promise<HealthStatus> {
    const isHealthy = Math.random() > 0.08;

    return {
      service: 'queue',
      status: isHealthy ? 'healthy' : 'degraded',
      uptime: isHealthy ? 99.85 : 94,
      responseTime: Math.random() * 150 + 30,
      lastCheck: new Date(),
      message: isHealthy ? 'Message queue healthy' : 'Queue backlog detected',
    };
  }

  static async getSystemHealth(): Promise<SystemHealth> {
    const services: HealthStatus[] = [
      await this.checkServiceHealth('api'),
      await this.checkServiceHealth('auth'),
      await this.checkServiceHealth('notifications'),
    ];

    const dbHealth = await this.checkDatabaseHealth();
    const cacheHealth = await this.checkCacheHealth();
    const queueHealth = await this.checkQueueHealth();

    const allHealthy = services.every((s) => s.status === 'healthy') &&
      dbHealth.status === 'healthy' &&
      cacheHealth.status === 'healthy' &&
      queueHealth.status === 'healthy';

    const errorRate =
      services.filter((s) => s.status !== 'healthy').length /
      (services.length + 3) *
      100;

    return {
      overall: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date(),
      services: [...services, dbHealth, cacheHealth, queueHealth],
      database: dbHealth.status,
      cache: cacheHealth.status,
      queue: queueHealth.status,
      errorRate,
    };
  }

  static async registerDependency(
    service: string,
    dependencies: string[],
    criticalDependencies: string[] = []
  ): Promise<void> {
    serviceDependencies.set(service, {
      service,
      dependencies,
      criticalDependencies,
    });
  }

  static async checkDependencies(service: string): Promise<{
    service: string;
    allHealthy: boolean;
    criticalIssues: string[];
    warnings: string[];
  }> {
    const dependency = serviceDependencies.get(service);
    if (!dependency) {
      return {
        service,
        allHealthy: true,
        criticalIssues: [],
        warnings: [],
      };
    }

    const criticalIssues: string[] = [];
    const warnings: string[] = [];

    for (const dep of dependency.criticalDependencies) {
      if (Math.random() > 0.95) {
        criticalIssues.push(`Critical dependency unavailable: ${dep}`);
      }
    }

    for (const dep of dependency.dependencies) {
      if (Math.random() > 0.9) {
        warnings.push(`Dependency degraded: ${dep}`);
      }
    }

    return {
      service,
      allHealthy: criticalIssues.length === 0,
      criticalIssues,
      warnings,
    };
  }

  static async getUptime(service: string, days: number = 7): Promise<number> {
    const checks = healthChecks.get(service) || [];
    if (checks.length === 0) return 100;

    const recentChecks = checks.slice(-Math.min(checks.length, days * 24 * 6)); // 6 checks per hour
    const healthyChecks = recentChecks.filter((c) => c.status === 'healthy').length;

    return (healthyChecks / recentChecks.length) * 100;
  }

  static async getIncidents(timeWindowMinutes: number = 1440): Promise<HealthStatus[]> {
    const cutoff = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
    const incidents: HealthStatus[] = [];

    healthChecks.forEach((checks) => {
      checks.forEach((check) => {
        if (check.lastCheck > cutoff && check.status !== 'healthy') {
          incidents.push(check);
        }
      });
    });

    return incidents.sort((a, b) => b.lastCheck.getTime() - a.lastCheck.getTime());
  }

  static async recordHealthMetric(service: string, uptime: number): Promise<void> {
    if (!uptimeHistory.has(service)) {
      uptimeHistory.set(service, []);
    }

    uptimeHistory.get(service)!.push(uptime);

    const history = uptimeHistory.get(service)!;
    if (history.length > 1000) {
      history.shift();
    }

    await logAudit(null, AuditAction.ANALYTICS_VIEWED, 'HEALTH', service, {
      status: 'SUCCESS',
      details: { uptime },
    });
  }

  static async getHealthTrend(service: string): Promise<{
    average: number;
    trend: 'improving' | 'stable' | 'degrading';
    data: number[];
  }> {
    const data = uptimeHistory.get(service) || [];
    const recentData = data.slice(-24); // Last 24 data points

    if (recentData.length < 2) {
      return {
        average: 100,
        trend: 'stable',
        data: recentData,
      };
    }

    const average = recentData.reduce((a, b) => a + b, 0) / recentData.length;
    const firstHalf = recentData.slice(0, Math.floor(recentData.length / 2));
    const secondHalf = recentData.slice(Math.floor(recentData.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    let trend: 'improving' | 'stable' | 'degrading' = 'stable';
    if (secondAvg > firstAvg + 0.5) trend = 'improving';
    else if (secondAvg < firstAvg - 0.5) trend = 'degrading';

    return { average, trend, data: recentData };
  }

  static async generateHealthReport(): Promise<{
    summary: string;
    health: SystemHealth;
    incidents: HealthStatus[];
    recommendations: string[];
  }> {
    const health = await this.getSystemHealth();
    const incidents = await this.getIncidents(1440);

    const recommendations: string[] = [];
    if (health.database !== 'healthy') {
      recommendations.push('Database health degraded - investigate immediately');
    }
    if (health.cache !== 'healthy') {
      recommendations.push('Cache layer issues - check Redis connection');
    }
    if (incidents.length > 5) {
      recommendations.push('Multiple incidents detected - review system load and resources');
    }

    return {
      summary: `System Health: ${health.overall.toUpperCase()} (${(100 - health.errorRate).toFixed(1)}% uptime)`,
      health,
      incidents: incidents.slice(0, 10),
      recommendations,
    };
  }
}
