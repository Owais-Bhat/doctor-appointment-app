/**
 * Database Sharding API Routes
 *
 * POST /api/infrastructure/sharding
 * - action: create-shard - Create new database shard
 * - action: record-metric - Record shard metrics
 * - action: rebalance - Move data between shards
 * - action: disable - Disable shard
 *
 * GET /api/infrastructure/sharding
 * - action: list - List organization shards
 * - action: shard-for-entity - Get shard for entity
 * - action: distribution - Get shard distribution stats
 * - action: metrics - Get shard metrics
 * - action: health - Get shard health
 */

import { NextRequest, NextResponse } from 'next/server';
import { DatabaseShardingService } from '@/lib/infrastructure/databaseSharding';
import { rateLimit } from '@/lib/middleware/rateLimiter';
import { securityHeaders } from '@/lib/middleware/securityHeaders';

export async function POST(req: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(req, 'enterprise');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429, headers: securityHeaders() }
      );
    }

    const body = await req.json();
    const {
      action,
      organizationId,
      shardId,
      name,
      keyRange,
      dbHost,
      dbPort,
      dbName,
      replicationFactor,
      rowCount,
      sizeBytes,
      readOpsPerSecond,
      writeOpsPerSecond,
      avgQueryTimeMs,
      sourceShardId,
      targetShardId,
      rowsToMove,
    } = body;

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Missing organizationId' },
        { status: 400, headers: securityHeaders() }
      );
    }

    if (action === 'create-shard') {
      if (!name || !keyRange || !dbHost || !dbPort || !dbName) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const shard = await DatabaseShardingService.createShard(
        organizationId,
        name,
        keyRange,
        dbHost,
        dbPort,
        dbName,
        replicationFactor || 3
      );

      return NextResponse.json(
        { success: true, data: shard },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'record-metric') {
      if (!shardId || rowCount === undefined || sizeBytes === undefined) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      await DatabaseShardingService.recordMetric(
        shardId,
        rowCount,
        sizeBytes,
        readOpsPerSecond || 0,
        writeOpsPerSecond || 0,
        avgQueryTimeMs || 0
      );

      return NextResponse.json(
        { success: true, message: 'Metric recorded' },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'rebalance') {
      if (!sourceShardId || !targetShardId || !rowsToMove) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const result = await DatabaseShardingService.rebalanceShard(
        sourceShardId,
        targetShardId,
        rowsToMove
      );

      return NextResponse.json(
        { success: result.success, data: result },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'disable') {
      if (!shardId) {
        return NextResponse.json(
          { success: false, error: 'Missing shardId' },
          { status: 400, headers: securityHeaders() }
        );
      }

      await DatabaseShardingService.disableShard(shardId);

      return NextResponse.json(
        { success: true, message: 'Shard disabled' },
        { status: 200, headers: securityHeaders() }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400, headers: securityHeaders() }
      );
    }
  } catch (error) {
    console.error('Error in POST /api/infrastructure/sharding:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(req, 'enterprise');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429, headers: securityHeaders() }
      );
    }

    const action = req.nextUrl.searchParams.get('action');
    const organizationId = req.nextUrl.searchParams.get('organizationId');
    const shardId = req.nextUrl.searchParams.get('shardId');
    const entityId = req.nextUrl.searchParams.get('entityId');
    const hours = parseInt(req.nextUrl.searchParams.get('hours') || '24');

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Missing organizationId' },
        { status: 400, headers: securityHeaders() }
      );
    }

    if (action === 'list') {
      const shards = await DatabaseShardingService.getOrganizationShards(organizationId);

      return NextResponse.json(
        { success: true, data: shards },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'shard-for-entity') {
      if (!entityId) {
        return NextResponse.json(
          { success: false, error: 'Missing entityId' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const shard = await DatabaseShardingService.getShardForEntity(organizationId, entityId);

      return NextResponse.json(
        { success: !!shard, data: shard },
        { status: shard ? 200 : 404, headers: securityHeaders() }
      );
    } else if (action === 'distribution') {
      const distribution = await DatabaseShardingService.getShardDistribution(organizationId);

      return NextResponse.json(
        { success: true, data: distribution },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'metrics') {
      if (!shardId) {
        return NextResponse.json(
          { success: false, error: 'Missing shardId' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const metrics = await DatabaseShardingService.getShardMetrics(shardId, hours);

      return NextResponse.json(
        { success: true, data: metrics },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'health') {
      if (!shardId) {
        return NextResponse.json(
          { success: false, error: 'Missing shardId' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const health = await DatabaseShardingService.getShardHealth(shardId);

      return NextResponse.json(
        { success: !!health, data: health },
        { status: health ? 200 : 404, headers: securityHeaders() }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400, headers: securityHeaders() }
      );
    }
  } catch (error) {
    console.error('Error in GET /api/infrastructure/sharding:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}
