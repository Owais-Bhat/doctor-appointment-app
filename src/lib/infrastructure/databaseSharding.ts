/**
 * Database Sharding Service
 * Horizontal data partitioning across multiple database instances
 */

import { logAudit, AuditAction } from '@/lib/audit/logger';

interface ShardConfig {
  id: string;
  name: string;
  organizationId: string;
  keyRange: { min: number; max: number };
  dbHost: string;
  dbPort: number;
  dbName: string;
  replicationFactor: number;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ShardMetric {
  shardId: string;
  timestamp: Date;
  rowCount: number;
  sizeBytes: number;
  readOpsPerSecond: number;
  writeOpsPerSecond: number;
  avgQueryTimeMs: number;
}

interface ShardHealth {
  shardId: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastHealthCheck: Date;
  connectionHealth: number; // 0-100%
  replicationLag: number; // milliseconds
  diskUsagePercent: number;
}

const shardConfigs = new Map<string, ShardConfig>();
const shardMetrics = new Map<string, ShardMetric[]>();
const shardHealth = new Map<string, ShardHealth>();

export class DatabaseShardingService {
  static calculateShardKey(entityId: string, totalShards: number): number {
    const hash = entityId.split('').reduce((h, c) => (h << 5) - h + c.charCodeAt(0), 0);
    return Math.abs(hash) % totalShards;
  }

  static async createShard(
    organizationId: string,
    name: string,
    keyRange: { min: number; max: number },
    dbHost: string,
    dbPort: number,
    dbName: string,
    replicationFactor: number = 3
  ): Promise<ShardConfig> {
    const id = `shard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const config: ShardConfig = {
      id,
      name,
      organizationId,
      keyRange,
      dbHost,
      dbPort,
      dbName,
      replicationFactor,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    };

    shardConfigs.set(id, config);
    shardHealth.set(id, {
      shardId: id,
      status: 'healthy',
      lastHealthCheck: now,
      connectionHealth: 100,
      replicationLag: 0,
      diskUsagePercent: 0,
    });

    await logAudit(null, AuditAction.SETTINGS_UPDATED, 'SHARD_CREATED', id, {
      status: 'SUCCESS',
      details: { organizationId, name, keyRange },
    });

    return config;
  }

  static async getShard(shardId: string): Promise<ShardConfig | undefined> {
    return shardConfigs.get(shardId);
  }

  static async getOrganizationShards(organizationId: string): Promise<ShardConfig[]> {
    return Array.from(shardConfigs.values()).filter(
      (shard) => shard.organizationId === organizationId && shard.enabled
    );
  }

  static async getShardForEntity(
    organizationId: string,
    entityId: string
  ): Promise<ShardConfig | null> {
    const shards = await this.getOrganizationShards(organizationId);
    if (shards.length === 0) return null;

    const shardIndex = this.calculateShardKey(entityId, shards.length);
    return shards[shardIndex] || null;
  }

  static async recordMetric(
    shardId: string,
    rowCount: number,
    sizeBytes: number,
    readOpsPerSecond: number,
    writeOpsPerSecond: number,
    avgQueryTimeMs: number
  ): Promise<void> {
    if (!shardMetrics.has(shardId)) {
      shardMetrics.set(shardId, []);
    }

    const metric: ShardMetric = {
      shardId,
      timestamp: new Date(),
      rowCount,
      sizeBytes,
      readOpsPerSecond,
      writeOpsPerSecond,
      avgQueryTimeMs,
    };

    shardMetrics.get(shardId)!.push(metric);

    // Keep only last 24 hours of metrics
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const filtered = shardMetrics
      .get(shardId)!
      .filter((m) => m.timestamp > oneDayAgo);
    shardMetrics.set(shardId, filtered);
  }

  static async updateShardHealth(
    shardId: string,
    status: 'healthy' | 'degraded' | 'unhealthy',
    connectionHealth: number,
    replicationLag: number,
    diskUsagePercent: number
  ): Promise<void> {
    shardHealth.set(shardId, {
      shardId,
      status,
      lastHealthCheck: new Date(),
      connectionHealth,
      replicationLag,
      diskUsagePercent,
    });

    if (status !== 'healthy') {
      await logAudit(null, AuditAction.SETTINGS_UPDATED, 'SHARD_HEALTH_ALERT', shardId, {
        status: 'ALERT',
        details: { status, connectionHealth, replicationLag, diskUsagePercent },
      });
    }
  }

  static async getShardHealth(shardId: string): Promise<ShardHealth | undefined> {
    return shardHealth.get(shardId);
  }

  static async getShardMetrics(shardId: string, hours: number = 24): Promise<ShardMetric[]> {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const metrics = shardMetrics.get(shardId) || [];

    return metrics.filter((m) => m.timestamp > cutoff);
  }

  static async getShardDistribution(organizationId: string): Promise<{
    totalShards: number;
    shardStats: Array<{
      shardId: string;
      name: string;
      rowCount: number;
      sizeBytes: number;
      loadPercent: number;
    }>;
    balanceHealth: number; // 0-100, how evenly distributed
  }> {
    const shards = await this.getOrganizationShards(organizationId);
    const shardStats = [];
    let totalRows = 0;
    let totalSize = 0;

    for (const shard of shards) {
      const metrics = await this.getShardMetrics(shard.id, 1);
      const latestMetric = metrics[metrics.length - 1];

      if (latestMetric) {
        totalRows += latestMetric.rowCount;
        totalSize += latestMetric.sizeBytes;
        shardStats.push({
          shardId: shard.id,
          name: shard.name,
          rowCount: latestMetric.rowCount,
          sizeBytes: latestMetric.sizeBytes,
          loadPercent: 0, // Will be calculated below
        });
      }
    }

    // Calculate load percentages
    shardStats.forEach((stat) => {
      stat.loadPercent = totalRows > 0 ? (stat.rowCount / totalRows) * 100 : 0;
    });

    // Calculate balance health (how close to ideal 100/n%)
    const idealLoad = 100 / shards.length;
    const variance = shardStats.reduce((sum, stat) => sum + Math.pow(stat.loadPercent - idealLoad, 2), 0);
    const stdDev = Math.sqrt(variance / shards.length);
    const balanceHealth = Math.max(0, 100 - stdDev * 2);

    return {
      totalShards: shards.length,
      shardStats,
      balanceHealth: Math.round(balanceHealth * 100) / 100,
    };
  }

  static async rebalanceShard(
    sourceShardId: string,
    targetShardId: string,
    rowsToMove: number
  ): Promise<{ success: boolean; rowsMoved: number; timeMs: number }> {
    const startTime = Date.now();

    // Simulate rebalancing
    const rowsMoved = Math.min(rowsToMove, 10000); // Batch size limit

    await logAudit(null, AuditAction.SETTINGS_UPDATED, 'SHARD_REBALANCE', sourceShardId, {
      status: 'SUCCESS',
      details: { sourceShardId, targetShardId, rowsMoved },
    });

    return {
      success: true,
      rowsMoved,
      timeMs: Date.now() - startTime,
    };
  }

  static async disableShard(shardId: string): Promise<void> {
    const shard = shardConfigs.get(shardId);
    if (shard) {
      shard.enabled = false;
      shard.updatedAt = new Date();
    }

    await logAudit(null, AuditAction.SETTINGS_UPDATED, 'SHARD_DISABLED', shardId, {
      status: 'SUCCESS',
      details: {},
    });
  }

  static async getShardingStrategy(organizationId: string): Promise<{
    strategy: string;
    shardKey: string;
    totalShards: number;
    replicationFactor: number;
    consistency: string;
  }> {
    const shards = await this.getOrganizationShards(organizationId);

    return {
      strategy: 'range-based',
      shardKey: 'entityId',
      totalShards: shards.length,
      replicationFactor: shards[0]?.replicationFactor || 3,
      consistency: 'eventual',
    };
  }
}
