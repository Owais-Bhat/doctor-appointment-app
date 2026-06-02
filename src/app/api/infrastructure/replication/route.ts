/**
 * Replication Monitoring API Routes
 *
 * POST /api/infrastructure/replication
 * - action: add-replica - Add replica node
 * - action: record-metric - Record replication metric
 * - action: record-conflict - Record replication conflict
 * - action: disable-replica - Disable replica
 *
 * GET /api/infrastructure/replication
 * - action: status - Get replication status
 * - action: sync-status - Get synchronization status
 * - action: health - Get replication health
 * - action: conflicts - Get conflict history
 * - action: replicas - List replicas
 */

import { NextRequest, NextResponse } from 'next/server';
import { ReplicationMonitoringService } from '@/lib/infrastructure/replicationMonitoring';
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
      name,
      replicaType,
      host,
      port,
      region,
      replicaId,
      lagBytes,
      lagSeconds,
      binlogPosition,
      replicatedEventCount,
      errorCount,
      throughputMbps,
      conflictType,
      primaryValue,
      replicaValue,
      resolution,
    } = body;

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Missing organizationId' },
        { status: 400, headers: securityHeaders() }
      );
    }

    if (action === 'add-replica') {
      if (!name || !replicaType || !host || !port || !region) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const replica = await ReplicationMonitoringService.addReplicaNode(
        organizationId,
        name,
        replicaType,
        host,
        port,
        region
      );

      return NextResponse.json(
        { success: true, data: replica },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'record-metric') {
      if (
        !replicaId ||
        lagBytes === undefined ||
        lagSeconds === undefined ||
        !binlogPosition ||
        replicatedEventCount === undefined ||
        errorCount === undefined ||
        throughputMbps === undefined
      ) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      await ReplicationMonitoringService.recordReplicationMetric(
        replicaId,
        lagBytes,
        lagSeconds,
        binlogPosition,
        replicatedEventCount,
        errorCount,
        throughputMbps
      );

      return NextResponse.json(
        { success: true, message: 'Metric recorded' },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'record-conflict') {
      if (!conflictType || !primaryValue || !replicaValue || !resolution) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const conflict = await ReplicationMonitoringService.recordConflict(
        organizationId,
        conflictType,
        primaryValue,
        replicaValue,
        resolution
      );

      return NextResponse.json(
        { success: true, data: conflict },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'disable-replica') {
      if (!replicaId) {
        return NextResponse.json(
          { success: false, error: 'Missing replicaId' },
          { status: 400, headers: securityHeaders() }
        );
      }

      await ReplicationMonitoringService.disableReplica(replicaId);

      return NextResponse.json(
        { success: true, message: 'Replica disabled' },
        { status: 200, headers: securityHeaders() }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400, headers: securityHeaders() }
      );
    }
  } catch (error) {
    console.error('Error in POST /api/infrastructure/replication:', error);
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
    const replicaId = req.nextUrl.searchParams.get('replicaId');
    const hours = parseInt(req.nextUrl.searchParams.get('hours') || '1');
    const days = parseInt(req.nextUrl.searchParams.get('days') || '7');

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Missing organizationId' },
        { status: 400, headers: securityHeaders() }
      );
    }

    if (action === 'status') {
      if (!replicaId) {
        return NextResponse.json(
          { success: false, error: 'Missing replicaId' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const status = await ReplicationMonitoringService.getReplicationStatus(replicaId, hours);

      return NextResponse.json(
        { success: true, data: status },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'sync-status') {
      const replicas = await ReplicationMonitoringService.getOrganizationReplicas(organizationId);
      const primaryReplica = replicas.find((r) => r.replicaType === 'primary');

      if (!primaryReplica) {
        return NextResponse.json(
          { success: false, error: 'No primary replica found' },
          { status: 404, headers: securityHeaders() }
        );
      }

      const syncStatus = await ReplicationMonitoringService.updateSynchronizationStatus(
        organizationId,
        primaryReplica.id
      );

      return NextResponse.json(
        { success: true, data: syncStatus },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'health') {
      const health = await ReplicationMonitoringService.getReplicationHealth(organizationId);

      return NextResponse.json(
        { success: true, data: health },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'conflicts') {
      const conflicts = await ReplicationMonitoringService.getConflictHistory(organizationId, days);

      return NextResponse.json(
        { success: true, data: conflicts },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'replicas') {
      const replicas = await ReplicationMonitoringService.getOrganizationReplicas(organizationId);

      return NextResponse.json(
        { success: true, data: replicas },
        { status: 200, headers: securityHeaders() }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400, headers: securityHeaders() }
      );
    }
  } catch (error) {
    console.error('Error in GET /api/infrastructure/replication:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}
