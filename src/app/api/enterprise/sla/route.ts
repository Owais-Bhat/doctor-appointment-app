/**
 * Enterprise SLA API Routes
 *
 * POST /api/enterprise/sla
 * - action: create - Create new SLA
 * - action: record-metric - Record metric
 * - action: update - Update SLA
 * - action: disable - Disable SLA
 *
 * GET /api/enterprise/sla
 * - action: list - List organization SLAs
 * - action: status - Get SLA status
 * - action: breaches - Get recent breaches
 * - action: report - Generate SLA report
 * - action: metrics - Get endpoint metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { SLATrackingService } from '@/lib/enterprise/slaTracking';
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
    const { action, organizationId, slaId, name, uptime, responseTimeMs, resolutionTimeHours, updates } = body;

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Missing organizationId' },
        { status: 400, headers: securityHeaders() }
      );
    }

    if (action === 'create') {
      if (!name || uptime === undefined || !responseTimeMs || !resolutionTimeHours) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const sla = await SLATrackingService.createSLA(
        organizationId,
        name,
        uptime,
        responseTimeMs,
        resolutionTimeHours
      );

      return NextResponse.json(
        { success: true, data: sla },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'record-metric') {
      const { responseTime, isSuccessful, endpointPath, statusCode } = body;

      if (!slaId || responseTime === undefined || isSuccessful === undefined || !endpointPath) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      await SLATrackingService.recordMetric(
        organizationId,
        slaId,
        responseTime,
        isSuccessful,
        endpointPath,
        statusCode || 200
      );

      return NextResponse.json(
        { success: true, message: 'Metric recorded' },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'update') {
      if (!slaId || !updates) {
        return NextResponse.json(
          { success: false, error: 'Missing slaId or updates' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const updated = await SLATrackingService.updateSLA(slaId, updates);

      return NextResponse.json(
        { success: !!updated, data: updated },
        { status: updated ? 200 : 404, headers: securityHeaders() }
      );
    } else if (action === 'disable') {
      if (!slaId) {
        return NextResponse.json(
          { success: false, error: 'Missing slaId' },
          { status: 400, headers: securityHeaders() }
        );
      }

      await SLATrackingService.disableSLA(slaId);

      return NextResponse.json(
        { success: true, message: 'SLA disabled' },
        { status: 200, headers: securityHeaders() }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400, headers: securityHeaders() }
      );
    }
  } catch (error) {
    console.error('Error in POST /api/enterprise/sla:', error);
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
    const slaId = req.nextUrl.searchParams.get('slaId');
    const endpointPath = req.nextUrl.searchParams.get('endpointPath');
    const days = parseInt(req.nextUrl.searchParams.get('days') || '30');

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Missing organizationId' },
        { status: 400, headers: securityHeaders() }
      );
    }

    if (action === 'list') {
      const slas = await SLATrackingService.getOrganizationSLAs(organizationId);

      return NextResponse.json(
        { success: true, data: slas },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'status') {
      if (!slaId) {
        return NextResponse.json(
          { success: false, error: 'Missing slaId' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const status = await SLATrackingService.getSLAStatus(organizationId, slaId);

      return NextResponse.json(
        { success: !!status, data: status },
        { status: status ? 200 : 404, headers: securityHeaders() }
      );
    } else if (action === 'breaches') {
      const breaches = await SLATrackingService.getBreaches(organizationId, days);

      return NextResponse.json(
        { success: true, data: breaches },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'report') {
      const report = await SLATrackingService.generateSLAReport(organizationId);

      return NextResponse.json(
        { success: true, data: report },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'metrics') {
      if (!endpointPath) {
        return NextResponse.json(
          { success: false, error: 'Missing endpointPath' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const metrics = await SLATrackingService.getMetricsForEndpoint(organizationId, endpointPath, 24);

      return NextResponse.json(
        { success: true, data: metrics },
        { status: 200, headers: securityHeaders() }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400, headers: securityHeaders() }
      );
    }
  } catch (error) {
    console.error('Error in GET /api/enterprise/sla:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}
