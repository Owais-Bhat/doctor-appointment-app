/**
 * Disaster Recovery API Routes
 *
 * POST /api/infrastructure/disaster-recovery
 * - action: create-backup - Create backup config
 * - action: execute-backup - Execute backup
 * - action: create-plan - Create recovery plan
 * - action: failover - Initiate failover
 * - action: test-plan - Test recovery plan
 *
 * GET /api/infrastructure/disaster-recovery
 * - action: backups - List backup snapshots
 * - action: plans - List recovery plans
 * - action: failovers - Failover history
 * - action: objectives - Recovery objectives
 * - action: replication-status - Replication status
 */

import { NextRequest, NextResponse } from 'next/server';
import { DisasterRecoveryService } from '@/lib/infrastructure/disasterRecovery';
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
      backupType,
      scheduleFrequency,
      retentionDays,
      targetLocation,
      encrypted,
      compressionEnabled,
      backupConfigId,
      recoveryPlanId,
      recoveryTimeObjectiveMinutes,
      recoveryPointObjectiveMinutes,
      primaryRegion,
      standbyRegion,
      failoverAutomation,
      reason,
    } = body;

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Missing organizationId' },
        { status: 400, headers: securityHeaders() }
      );
    }

    if (action === 'create-backup') {
      if (!name || !backupType || !scheduleFrequency || !retentionDays || !targetLocation) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const config = await DisasterRecoveryService.createBackupConfig(
        organizationId,
        name,
        backupType,
        scheduleFrequency,
        retentionDays,
        targetLocation,
        encrypted !== false,
        compressionEnabled !== false
      );

      return NextResponse.json(
        { success: true, data: config },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'execute-backup') {
      if (!backupConfigId) {
        return NextResponse.json(
          { success: false, error: 'Missing backupConfigId' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const snapshot = await DisasterRecoveryService.executeBackup(backupConfigId);

      return NextResponse.json(
        { success: true, data: snapshot },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'create-plan') {
      if (
        !name ||
        recoveryTimeObjectiveMinutes === undefined ||
        recoveryPointObjectiveMinutes === undefined ||
        !primaryRegion ||
        !standbyRegion
      ) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const plan = await DisasterRecoveryService.createRecoveryPlan(
        organizationId,
        name,
        recoveryTimeObjectiveMinutes,
        recoveryPointObjectiveMinutes,
        primaryRegion,
        standbyRegion,
        failoverAutomation !== false
      );

      return NextResponse.json(
        { success: true, data: plan },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'failover') {
      if (!recoveryPlanId || !reason) {
        return NextResponse.json(
          { success: false, error: 'Missing recoveryPlanId or reason' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const event = await DisasterRecoveryService.initiateFailover(organizationId, recoveryPlanId, reason);

      return NextResponse.json(
        { success: true, data: event },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'test-plan') {
      if (!recoveryPlanId) {
        return NextResponse.json(
          { success: false, error: 'Missing recoveryPlanId' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const result = await DisasterRecoveryService.testRecoveryPlan(recoveryPlanId);

      return NextResponse.json(
        { success: result.testResult === 'passed', data: result },
        { status: 200, headers: securityHeaders() }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400, headers: securityHeaders() }
      );
    }
  } catch (error) {
    console.error('Error in POST /api/infrastructure/disaster-recovery:', error);
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
    const days = parseInt(req.nextUrl.searchParams.get('days') || '30');
    const recoveryPlanId = req.nextUrl.searchParams.get('recoveryPlanId');

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Missing organizationId' },
        { status: 400, headers: securityHeaders() }
      );
    }

    if (action === 'backups') {
      const snapshots = await DisasterRecoveryService.getBackupSnapshots(organizationId, days);

      return NextResponse.json(
        { success: true, data: snapshots },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'failovers') {
      const history = await DisasterRecoveryService.getFailoverHistory(organizationId, days);

      return NextResponse.json(
        { success: true, data: history },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'objectives') {
      if (!recoveryPlanId) {
        return NextResponse.json(
          { success: false, error: 'Missing recoveryPlanId' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const objectives = await DisasterRecoveryService.getRecoveryObjectives(recoveryPlanId);

      return NextResponse.json(
        { success: true, data: objectives },
        { status: 200, headers: securityHeaders() }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400, headers: securityHeaders() }
      );
    }
  } catch (error) {
    console.error('Error in GET /api/infrastructure/disaster-recovery:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}
