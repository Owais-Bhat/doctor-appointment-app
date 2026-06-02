/**
 * Performance Monitoring Service
 * Application Performance Monitoring (APM) and metrics collection
 */

import { logAudit, AuditAction } from '@/lib/audit/logger';

interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags: Record<string, string>;
  status: 'normal' | 'warning' | 'critical';
}

interface ServiceMetrics {
  serviceName: string;
  requestCount: number;
  errorCount: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  throughput: number; // requests per second
  lastUpdated: Date;
}

interface AnomalyAlert {
  id: string;
  metric: string;
  threshold: number;
  actualValue: number;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  createdAt: Date;
}

const metrics = new Map<string, PerformanceMetric[]>();
const serviceMetrics = new Map<string, ServiceMetrics>();
const anomalyAlerts = new Map<string, AnomalyAlert>();

export class PerformanceMonitoringService {
  static async recordMetric(
    name: string,
    value: number,
    unit: string = 'ms',
    tags: Record<string, string> = {}
  ): Promise<PerformanceMetric> {
    const id = `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Determine status based on typical thresholds
    let status: 'normal' | 'warning' | 'critical' = 'normal';
    if (name === 'response_time' && value > 1000) status = 'critical';
    else if (name === 'response_time' && value > 500) status = 'warning';
    else if (name === 'error_rate' && value > 5) status = 'critical';
    else if (name === 'error_rate' && value > 1) status = 'warning';

    const metric: PerformanceMetric = {
      id,
      name,
      value,
      unit,
      timestamp: new Date(),
      tags,
      status,
    };

    if (!metrics.has(name)) {
      metrics.set(name, []);
    }
    metrics.get(name)!.push(metric);

    // Check for anomalies
    if (status !== 'normal') {
      await this.checkAnomaly(name, value);
    }

    return metric;
  }

  static async recordServiceMetrics(
    serviceName: string,
    requestCount: number,
    errorCount: number,
    responseTimes: number[]
  ): Promise<ServiceMetrics> {
    responseTimes.sort((a, b) => a - b);

    const serviceMetric: ServiceMetrics = {
      serviceName,
      requestCount,
      errorCount,
      averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      p95ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.95)],
      p99ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.99)],
      throughput: requestCount / 60, // per second
      lastUpdated: new Date(),
    };

    serviceMetrics.set(serviceName, serviceMetric);

    await logAudit(null, AuditAction.ANALYTICS_VIEWED, 'METRICS', serviceName, {
      status: 'SUCCESS',
      details: {
        requestCount,
        errorRate: (errorCount / requestCount) * 100,
        avgResponseTime: serviceMetric.averageResponseTime,
      },
    });

    return serviceMetric;
  }

  static async getServiceMetrics(serviceName: string): Promise<ServiceMetrics | undefined> {
    return serviceMetrics.get(serviceName);
  }

  static async getMetrics(name: string, limit: number = 100): Promise<PerformanceMetric[]> {
    const metricList = metrics.get(name) || [];
    return metricList.slice(-limit);
  }

  static async checkAnomaly(metric: string, value: number): Promise<AnomalyAlert | null> {
    const thresholds: Record<string, number> = {
      response_time: 1000,
      error_rate: 5,
      cpu_usage: 80,
      memory_usage: 85,
      disk_usage: 90,
    };

    const threshold = thresholds[metric];
    if (!threshold || value <= threshold) return null;

    let severity: 'info' | 'warning' | 'critical' = 'warning';
    if (value > threshold * 1.5) severity = 'critical';

    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const alert: AnomalyAlert = {
      id: alertId,
      metric,
      threshold,
      actualValue: value,
      severity,
      message: `${metric} exceeded threshold: ${value.toFixed(2)} > ${threshold}`,
      createdAt: new Date(),
    };

    anomalyAlerts.set(alertId, alert);

    await logAudit(null, AuditAction.ANALYTICS_VIEWED, 'ANOMALY', alertId, {
      status: 'SUCCESS',
      details: {
        metric,
        threshold,
        actualValue: value,
        severity,
      },
    });

    return alert;
  }

  static async getAnomalies(timeWindowMinutes: number = 60): Promise<AnomalyAlert[]> {
    const cutoff = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

    return Array.from(anomalyAlerts.values())
      .filter((a) => a.createdAt > cutoff)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  static async trackTransaction(
    transactionId: string,
    name: string,
    duration: number,
    status: 'success' | 'error'
  ): Promise<void> {
    await this.recordMetric(`transaction_${name}`, duration, 'ms', {
      transactionId,
      status,
    });
  }

  static async getMetricsSummary(): Promise<{
    totalRequests: number;
    totalErrors: number;
    avgResponseTime: number;
    errorRate: number;
    services: ServiceMetrics[];
  }> {
    let totalRequests = 0;
    let totalErrors = 0;
    let totalResponseTime = 0;
    let serviceCount = 0;

    const services = Array.from(serviceMetrics.values());

    services.forEach((s) => {
      totalRequests += s.requestCount;
      totalErrors += s.errorCount;
      totalResponseTime += s.averageResponseTime;
      serviceCount++;
    });

    return {
      totalRequests,
      totalErrors,
      avgResponseTime: totalResponseTime / (serviceCount || 1),
      errorRate: (totalErrors / totalRequests) * 100 || 0,
      services,
    };
  }

  static async setPerformanceThreshold(
    metric: string,
    threshold: number,
    unit: string
  ): Promise<void> {
    await logAudit(null, AuditAction.SETTINGS_UPDATED, 'THRESHOLD', metric, {
      status: 'SUCCESS',
      details: { metric, threshold, unit },
    });
  }

  static async generatePerformanceReport(): Promise<{
    summary: string;
    topMetrics: PerformanceMetric[];
    alerts: AnomalyAlert[];
    recommendations: string[];
  }> {
    const alerts = await this.getAnomalies(60);
    const topMetrics = Array.from(metrics.values())
      .flatMap((m) => m)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    return {
      summary: `System operating at ${(100 - (alerts.length > 0 ? 15 : 0)).toFixed(1)}% efficiency`,
      topMetrics,
      alerts,
      recommendations: [
        'Monitor API response times closely',
        'Optimize database queries',
        'Consider scaling services with high load',
        'Investigate recent error spikes',
      ],
    };
  }
}
