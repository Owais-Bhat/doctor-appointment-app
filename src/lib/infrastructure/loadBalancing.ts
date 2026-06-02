/**
 * Load Balancing Service
 * Distribute traffic across multiple server instances
 */

import { logAudit, AuditAction } from '@/lib/audit/logger';

interface ServerInstance {
  id: string;
  organizationId: string;
  hostname: string;
  port: number;
  weight: number; // Higher = more traffic
  status: 'healthy' | 'degraded' | 'unhealthy';
  region: string;
  capacity: number; // Max concurrent connections
  currentLoad: number; // Current connections
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface LoadBalancerConfig {
  id: string;
  organizationId: string;
  name: string;
  algorithm: 'round-robin' | 'least-connections' | 'weighted' | 'ip-hash';
  healthCheckIntervalMs: number;
  healthCheckTimeoutMs: number;
  maxRetries: number;
  sessionPersistence: boolean;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface RoutingDecision {
  selectedInstanceId: string;
  algorithm: string;
  loadPercent: number;
  connectionCount: number;
}

const serverInstances = new Map<string, ServerInstance>();
const loadBalancerConfigs = new Map<string, LoadBalancerConfig>();
const requestHistory = new Map<string, { timestamp: Date; instanceId: string }[]>();
const healthCheckResults = new Map<string, { timestamp: Date; healthy: boolean }[]>();

export class LoadBalancingService {
  static async createServerInstance(
    organizationId: string,
    hostname: string,
    port: number,
    region: string,
    weight: number = 1,
    capacity: number = 1000
  ): Promise<ServerInstance> {
    const id = `instance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const instance: ServerInstance = {
      id,
      organizationId,
      hostname,
      port,
      weight,
      status: 'healthy',
      region,
      capacity,
      currentLoad: 0,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    };

    serverInstances.set(id, instance);

    await logAudit(null, AuditAction.SETTINGS_UPDATED, 'INSTANCE_CREATED', id, {
      status: 'SUCCESS',
      details: { organizationId, hostname, region },
    });

    return instance;
  }

  static async createLoadBalancer(
    organizationId: string,
    name: string,
    algorithm: 'round-robin' | 'least-connections' | 'weighted' | 'ip-hash' = 'round-robin',
    healthCheckIntervalMs: number = 5000
  ): Promise<LoadBalancerConfig> {
    const id = `lb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const config: LoadBalancerConfig = {
      id,
      organizationId,
      name,
      algorithm,
      healthCheckIntervalMs,
      healthCheckTimeoutMs: 2000,
      maxRetries: 3,
      sessionPersistence: true,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    };

    loadBalancerConfigs.set(id, config);

    await logAudit(null, AuditAction.SETTINGS_UPDATED, 'LOAD_BALANCER_CREATED', id, {
      status: 'SUCCESS',
      details: { organizationId, name, algorithm },
    });

    return config;
  }

  static async routeRequest(
    organizationId: string,
    loadBalancerId: string,
    clientIp: string,
    requestPath: string
  ): Promise<RoutingDecision> {
    const config = loadBalancerConfigs.get(loadBalancerId);
    if (!config) {
      throw new Error('Load balancer not found');
    }

    const instances = Array.from(serverInstances.values())
      .filter((i) => i.organizationId === organizationId && i.enabled && i.status === 'healthy');

    if (instances.length === 0) {
      throw new Error('No healthy instances available');
    }

    let selectedInstance: ServerInstance;

    switch (config.algorithm) {
      case 'round-robin':
        selectedInstance = this.selectRoundRobin(instances, loadBalancerId);
        break;
      case 'least-connections':
        selectedInstance = this.selectLeastConnections(instances);
        break;
      case 'weighted':
        selectedInstance = this.selectWeighted(instances);
        break;
      case 'ip-hash':
        selectedInstance = this.selectIpHash(instances, clientIp);
        break;
      default:
        selectedInstance = instances[0];
    }

    // Record routing decision
    if (!requestHistory.has(loadBalancerId)) {
      requestHistory.set(loadBalancerId, []);
    }
    requestHistory.get(loadBalancerId)!.push({
      timestamp: new Date(),
      instanceId: selectedInstance.id,
    });

    selectedInstance.currentLoad++;

    return {
      selectedInstanceId: selectedInstance.id,
      algorithm: config.algorithm,
      loadPercent: (selectedInstance.currentLoad / selectedInstance.capacity) * 100,
      connectionCount: selectedInstance.currentLoad,
    };
  }

  private static selectRoundRobin(instances: ServerInstance[], loadBalancerId: string): ServerInstance {
    const history = requestHistory.get(loadBalancerId) || [];
    const lastInstanceId = history.length > 0 ? history[history.length - 1].instanceId : null;

    const lastIndex = instances.findIndex((i) => i.id === lastInstanceId);
    const nextIndex = (lastIndex + 1) % instances.length;

    return instances[nextIndex];
  }

  private static selectLeastConnections(instances: ServerInstance[]): ServerInstance {
    return instances.reduce((min, curr) =>
      curr.currentLoad < min.currentLoad ? curr : min
    );
  }

  private static selectWeighted(instances: ServerInstance[]): ServerInstance {
    const totalWeight = instances.reduce((sum, i) => sum + i.weight, 0);
    let random = Math.random() * totalWeight;

    for (const instance of instances) {
      random -= instance.weight;
      if (random <= 0) {
        return instance;
      }
    }

    return instances[0];
  }

  private static selectIpHash(instances: ServerInstance[], clientIp: string): ServerInstance {
    const hash = clientIp.split('').reduce((h, c) => (h << 5) - h + c.charCodeAt(0), 0);
    const index = Math.abs(hash) % instances.length;
    return instances[index];
  }

  static async performHealthCheck(instanceId: string): Promise<boolean> {
    const instance = serverInstances.get(instanceId);
    if (!instance) return false;

    // Simulate health check
    const healthy = Math.random() > 0.1; // 90% success rate

    if (!healthCheckResults.has(instanceId)) {
      healthCheckResults.set(instanceId, []);
    }

    healthCheckResults.get(instanceId)!.push({
      timestamp: new Date(),
      healthy,
    });

    // Update instance status
    const recentChecks = (healthCheckResults.get(instanceId) || []).slice(-10);
    const healthyCount = recentChecks.filter((c) => c.healthy).length;
    const healthPercent = (healthyCount / recentChecks.length) * 100;

    if (healthPercent >= 80) {
      instance.status = 'healthy';
    } else if (healthPercent >= 50) {
      instance.status = 'degraded';
    } else {
      instance.status = 'unhealthy';
    }

    if (!healthy) {
      await logAudit(null, AuditAction.SETTINGS_UPDATED, 'HEALTH_CHECK_FAILED', instanceId, {
        status: 'ALERT',
        details: { healthPercent },
      });
    }

    return healthy;
  }

  static async getHealthMetrics(instanceId: string, hours: number = 1): Promise<{
    totalChecks: number;
    healthyChecks: number;
    failureRate: number;
    lastCheck: Date | null;
  }> {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const results = (healthCheckResults.get(instanceId) || []).filter((c) => c.timestamp > cutoff);

    const healthyChecks = results.filter((c) => c.healthy).length;
    const failureRate = results.length > 0 ? ((results.length - healthyChecks) / results.length) * 100 : 0;

    return {
      totalChecks: results.length,
      healthyChecks,
      failureRate: Math.round(failureRate * 100) / 100,
      lastCheck: results.length > 0 ? results[results.length - 1].timestamp : null,
    };
  }

  static async getLoadBalancerMetrics(loadBalancerId: string, minutes: number = 5): Promise<{
    totalRequests: number;
    requestsPerSecond: number;
    instanceDistribution: Array<{ instanceId: string; requestCount: number; percentage: number }>;
    averageLoadPercent: number;
  }> {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    const requests = (requestHistory.get(loadBalancerId) || []).filter((r) => r.timestamp > cutoff);

    const distributionMap = new Map<string, number>();
    requests.forEach((r) => {
      distributionMap.set(r.instanceId, (distributionMap.get(r.instanceId) || 0) + 1);
    });

    const distribution = Array.from(distributionMap.entries())
      .map(([instanceId, count]) => ({
        instanceId,
        requestCount: count,
        percentage: (count / requests.length) * 100,
      }))
      .sort((a, b) => b.requestCount - a.requestCount);

    const instances = Array.from(
      new Set(Array.from(serverInstances.values()).filter((i) => i.enabled))
    );
    const avgLoad = instances.reduce((sum, i) => sum + (i.currentLoad / i.capacity) * 100, 0) / instances.length;

    return {
      totalRequests: requests.length,
      requestsPerSecond: requests.length / (minutes * 60),
      instanceDistribution: distribution,
      averageLoadPercent: Math.round(avgLoad * 100) / 100,
    };
  }

  static async getInstanceMetrics(instanceId: string): Promise<{
    currentLoad: number;
    capacity: number;
    loadPercent: number;
    status: string;
    responseTimeMs: number;
    errorRate: number;
  }> {
    const instance = serverInstances.get(instanceId);
    if (!instance) {
      throw new Error('Instance not found');
    }

    return {
      currentLoad: instance.currentLoad,
      capacity: instance.capacity,
      loadPercent: (instance.currentLoad / instance.capacity) * 100,
      status: instance.status,
      responseTimeMs: Math.floor(Math.random() * 200) + 50, // 50-250ms
      errorRate: Math.random() * 2, // 0-2%
    };
  }

  static async releaseConnection(instanceId: string): Promise<void> {
    const instance = serverInstances.get(instanceId);
    if (instance && instance.currentLoad > 0) {
      instance.currentLoad--;
    }
  }

  static async disableInstance(instanceId: string): Promise<void> {
    const instance = serverInstances.get(instanceId);
    if (instance) {
      instance.enabled = false;
      instance.updatedAt = new Date();
    }

    await logAudit(null, AuditAction.SETTINGS_UPDATED, 'INSTANCE_DISABLED', instanceId, {
      status: 'SUCCESS',
      details: {},
    });
  }
}
