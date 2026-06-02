/**
 * Database Replication Monitoring Service
 * Track replication health, lag, and synchronization across replicas
 */

import { logAudit, AuditAction } from '@/lib/audit/logger';

interface ReplicaNode {
  id: string;
  organizationId: string;
  name: string;
  replicaType: 'primary' | 'secondary' | 'tertiary';
  host: string;
  port: number;
  region: string;
  status: 'connected' | 'lagging' | 'disconnected';
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ReplicationMetric {
  replicaId: string;
  timestamp: Date;
  lagBytes: number; // Bytes behind primary
  lagSeconds: number; // Seconds behind primary
  binlogPosition: string;
  replicatedEventCount: number;
  errorCount: number;
  throughputMbps: number;
}

interface SynchronizationStatus {
  organizationId: string;
  primaryReplicaId: string;
  allInSync: boolean;
  maxLagSeconds: number;
  replicaCount: number;
  syncedReplicaCount: number;
  lastSyncTime: Date;
}

interface ConflictResolution {
  id: string;
  organizationId: string;
  timestamp: Date;
  conflictType: 'write-write' | 'update-delete' | 'foreign-key';
  primaryValue: string;
  replicaValue: string;
  resolution: 'primary-wins' | 'replica-wins' | 'manual';
  resolvedAt: Date;
}

const replicaNodes = new Map<string, ReplicaNode>();
const replicationMetrics = new Map<string, ReplicationMetric[]>();
const synchronizationStatus = new Map<string, SynchronizationStatus>();
const conflictLog = new Map<string, ConflictResolution[]>();

export class ReplicationMonitoringService {
  static async addReplicaNode(
    organizationId: string,
    name: string,
    replicaType: 'primary' | 'secondary' | 'tertiary',
    host: string,
    port: number,
    region: string
  ): Promise<ReplicaNode> {
    const id = `replica_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const node: ReplicaNode = {
      id,
      organizationId,
      name,
      replicaType,
      host,
      port,
      region,
      status: 'connected',
      enabled: true,
      createdAt: now,
      updatedAt: now,
    };

    replicaNodes.set(id, node);

    await logAudit(null, AuditAction.SETTINGS_UPDATED, 'REPLICA_ADDED', id, {
      status: 'SUCCESS',
      details: { organizationId, name, replicaType, region },
    });

    return node;
  }

  static async recordReplicationMetric(
    replicaId: string,
    lagBytes: number,
    lagSeconds: number,
    binlogPosition: string,
    replicatedEventCount: number,
    errorCount: number,
    throughputMbps: number
  ): Promise<void> {
    if (!replicationMetrics.has(replicaId)) {
      replicationMetrics.set(replicaId, []);
    }

    const metric: ReplicationMetric = {
      replicaId,
      timestamp: new Date(),
      lagBytes,
      lagSeconds,
      binlogPosition,
      replicatedEventCount,
      errorCount,
      throughputMbps,
    };

    replicationMetrics.get(replicaId)!.push(metric);

    // Keep last 24 hours of metrics
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const filtered = replicationMetrics.get(replicaId)!.filter((m) => m.timestamp > oneDayAgo);
    replicationMetrics.set(replicaId, filtered);

    // Update replica status based on lag
    const replica = replicaNodes.get(replicaId);
    if (replica) {
      if (lagSeconds > 30) {
        replica.status = 'lagging';

        await logAudit(null, AuditAction.SETTINGS_UPDATED, 'REPLICATION_LAG_DETECTED', replicaId, {
          status: 'ALERT',
          details: { lagSeconds, lagBytes },
        });
      } else if (lagSeconds === 0) {
        replica.status = 'connected';
      }
    }

    // Alert on errors
    if (errorCount > 0) {
      await logAudit(null, AuditAction.SETTINGS_UPDATED, 'REPLICATION_ERROR', replicaId, {
        status: 'ALERT',
        details: { errorCount, lagSeconds },
      });
    }
  }

  static async getReplicationStatus(replicaId: string, hours: number = 1): Promise<{
    currentLagSeconds: number;
    currentLagBytes: number;
    averageLagSeconds: number;
    maxLagSeconds: number;
    errorRate: number;
    throughputMbps: number;
  }> {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const metrics = (replicationMetrics.get(replicaId) || []).filter((m) => m.timestamp > cutoff);

    if (metrics.length === 0) {
      return {
        currentLagSeconds: 0,
        currentLagBytes: 0,
        averageLagSeconds: 0,
        maxLagSeconds: 0,
        errorRate: 0,
        throughputMbps: 0,
      };
    }

    const latest = metrics[metrics.length - 1];
    const avgLag = metrics.reduce((sum, m) => sum + m.lagSeconds, 0) / metrics.length;
    const maxLag = Math.max(...metrics.map((m) => m.lagSeconds));
    const totalErrors = metrics.reduce((sum, m) => sum + m.errorCount, 0);
    const avgThroughput = metrics.reduce((sum, m) => sum + m.throughputMbps, 0) / metrics.length;

    return {
      currentLagSeconds: latest.lagSeconds,
      currentLagBytes: latest.lagBytes,
      averageLagSeconds: Math.round(avgLag * 100) / 100,
      maxLagSeconds: maxLag,
      errorRate: (totalErrors / metrics.length) * 100,
      throughputMbps: Math.round(avgThroughput * 100) / 100,
    };
  }

  static async updateSynchronizationStatus(
    organizationId: string,
    primaryReplicaId: string
  ): Promise<SynchronizationStatus> {
    const replicas = Array.from(replicaNodes.values()).filter(
      (r) => r.organizationId === organizationId && r.enabled
    );

    let maxLag = 0;
    let syncedCount = 0;

    for (const replica of replicas) {
      const status = await this.getReplicationStatus(replica.id, 1);
      maxLag = Math.max(maxLag, status.currentLagSeconds);

      if (status.currentLagSeconds < 1) {
        syncedCount++;
      }
    }

    const syncStatus: SynchronizationStatus = {
      organizationId,
      primaryReplicaId,
      allInSync: syncedCount === replicas.length,
      maxLagSeconds: maxLag,
      replicaCount: replicas.length,
      syncedReplicaCount: syncedCount,
      lastSyncTime: new Date(),
    };

    synchronizationStatus.set(organizationId, syncStatus);

    if (!syncStatus.allInSync) {
      await logAudit(null, AuditAction.SETTINGS_UPDATED, 'SYNC_STATUS_DEGRADED', organizationId, {
        status: 'ALERT',
        details: { syncedCount, totalCount: replicas.length, maxLagSeconds: maxLag },
      });
    }

    return syncStatus;
  }

  static async getSynchronizationStatus(organizationId: string): Promise<SynchronizationStatus | undefined> {
    return synchronizationStatus.get(organizationId);
  }

  static async recordConflict(
    organizationId: string,
    conflictType: 'write-write' | 'update-delete' | 'foreign-key',
    primaryValue: string,
    replicaValue: string,
    resolution: 'primary-wins' | 'replica-wins' | 'manual'
  ): Promise<ConflictResolution> {
    const id = `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const conflict: ConflictResolution = {
      id,
      organizationId,
      timestamp: new Date(),
      conflictType,
      primaryValue,
      replicaValue,
      resolution,
      resolvedAt: new Date(),
    };

    if (!conflictLog.has(organizationId)) {
      conflictLog.set(organizationId, []);
    }

    conflictLog.get(organizationId)!.push(conflict);

    await logAudit(null, AuditAction.SETTINGS_UPDATED, 'REPLICATION_CONFLICT_DETECTED', id, {
      status: 'ALERT',
      details: { organizationId, conflictType, resolution },
    });

    return conflict;
  }

  static async getConflictHistory(organizationId: string, days: number = 7): Promise<ConflictResolution[]> {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const conflicts = conflictLog.get(organizationId) || [];

    return conflicts.filter((c) => c.timestamp > cutoff);
  }

  static async getOrganizationReplicas(organizationId: string): Promise<ReplicaNode[]> {
    return Array.from(replicaNodes.values()).filter(
      (r) => r.organizationId === organizationId && r.enabled
    );
  }

  static async getReplicationHealth(organizationId: string): Promise<{
    healthScore: number; // 0-100
    lagStatus: 'healthy' | 'warning' | 'critical';
    errorStatus: 'healthy' | 'warning' | 'critical';
    replicationStatus: 'healthy' | 'warning' | 'critical';
    recommendations: string[];
  }> {
    const replicas = await this.getOrganizationReplicas(organizationId);
    const syncStatus = synchronizationStatus.get(organizationId);

    let lagScore = 100;
    let errorScore = 100;
    let replicationScore = 100;
    const recommendations = [];

    // Analyze lag
    for (const replica of replicas) {
      const status = await this.getReplicationStatus(replica.id, 1);
      if (status.currentLagSeconds > 30) {
        lagScore -= 30;
        recommendations.push(`Replica ${replica.name} lagging by ${status.currentLagSeconds}s`);
      } else if (status.currentLagSeconds > 10) {
        lagScore -= 10;
      }

      if (status.errorRate > 5) {
        errorScore -= Math.min(status.errorRate, 100);
        recommendations.push(`Replica ${replica.name} has ${status.errorRate}% error rate`);
      }
    }

    // Check synchronization
    if (syncStatus && !syncStatus.allInSync) {
      replicationScore -= 40;
      recommendations.push(
        `${syncStatus.syncedReplicaCount}/${syncStatus.replicaCount} replicas in sync`
      );
    }

    const healthScore = Math.max(0, Math.min(100, (lagScore + errorScore + replicationScore) / 3));

    let lagStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (lagScore < 50) lagStatus = 'critical';
    else if (lagScore < 80) lagStatus = 'warning';

    let errorStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (errorScore < 50) errorStatus = 'critical';
    else if (errorScore < 80) errorStatus = 'warning';

    let replicationStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (replicationScore < 50) replicationStatus = 'critical';
    else if (replicationScore < 80) replicationStatus = 'warning';

    return {
      healthScore: Math.round(healthScore),
      lagStatus,
      errorStatus,
      replicationStatus,
      recommendations,
    };
  }

  static async disableReplica(replicaId: string): Promise<void> {
    const replica = replicaNodes.get(replicaId);
    if (replica) {
      replica.enabled = false;
      replica.updatedAt = new Date();
    }

    await logAudit(null, AuditAction.SETTINGS_UPDATED, 'REPLICA_DISABLED', replicaId, {
      status: 'SUCCESS',
      details: {},
    });
  }
}
