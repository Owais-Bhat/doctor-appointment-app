/**
 * Health Check API Routes
 *
 * POST /api/health
 * - action: check-service - Check specific service health
 * - action: register-dependency - Register service dependencies
 *
 * GET /api/health
 * - action: system - Get overall system health
 * - action: service - Get service health status
 * - action: database - Check database health
 * - action: cache - Check cache health
 * - action: queue - Check queue health
 * - action: dependencies - Check service dependencies
 * - action: uptime - Get service uptime
 * - action: incidents - Get recent incidents
 * - action: report - Generate health report
 * - action: trend - Get health trend
 */

import { NextRequest, NextResponse } from 'next/server';
import { HealthCheckService } from '@/lib/services/healthCheckService';
import { securityHeaders } from '@/lib/middleware/securityHeaders';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'check-service') {
      const { serviceName } = body;

      if (!serviceName) {
        return NextResponse.json(
          { success: false, error: 'Missing service name' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const health = await HealthCheckService.checkServiceHealth(serviceName);

      return NextResponse.json(
        { success: true, data: health },
        { status: 201, headers: securityHeaders() }
      );
    } else if (action === 'register-dependency') {
      const { service, dependencies, criticalDependencies } = body;

      if (!service || !Array.isArray(dependencies)) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      await HealthCheckService.registerDependency(
        service,
        dependencies,
        criticalDependencies || []
      );

      return NextResponse.json(
        { success: true },
        { status: 201, headers: securityHeaders() }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400, headers: securityHeaders() }
      );
    }
  } catch (error) {
    console.error('Error in POST /api/health:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const action = req.nextUrl.searchParams.get('action');
    const serviceName = req.nextUrl.searchParams.get('serviceName');
    const days = req.nextUrl.searchParams.get('days');
    const timeWindow = req.nextUrl.searchParams.get('timeWindow');

    if (action === 'system') {
      const health = await HealthCheckService.getSystemHealth();

      return NextResponse.json(
        { success: true, data: health },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'service') {
      if (!serviceName) {
        return NextResponse.json(
          { success: false, error: 'Missing service name' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const health = await HealthCheckService.checkServiceHealth(serviceName);

      return NextResponse.json(
        { success: true, data: health },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'database') {
      const health = await HealthCheckService.checkDatabaseHealth();

      return NextResponse.json(
        { success: true, data: health },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'cache') {
      const health = await HealthCheckService.checkCacheHealth();

      return NextResponse.json(
        { success: true, data: health },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'queue') {
      const health = await HealthCheckService.checkQueueHealth();

      return NextResponse.json(
        { success: true, data: health },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'dependencies') {
      if (!serviceName) {
        return NextResponse.json(
          { success: false, error: 'Missing service name' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const deps = await HealthCheckService.checkDependencies(serviceName);

      return NextResponse.json(
        { success: true, data: deps },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'uptime') {
      if (!serviceName) {
        return NextResponse.json(
          { success: false, error: 'Missing service name' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const uptime = await HealthCheckService.getUptime(serviceName, days ? parseInt(days) : 7);

      return NextResponse.json(
        { success: true, data: { uptime } },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'incidents') {
      const incidents = await HealthCheckService.getIncidents(
        timeWindow ? parseInt(timeWindow) : 1440
      );

      return NextResponse.json(
        { success: true, data: { incidents } },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'report') {
      const report = await HealthCheckService.generateHealthReport();

      return NextResponse.json(
        { success: true, data: report },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'trend') {
      if (!serviceName) {
        return NextResponse.json(
          { success: false, error: 'Missing service name' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const trend = await HealthCheckService.getHealthTrend(serviceName);

      return NextResponse.json(
        { success: true, data: trend },
        { status: 200, headers: securityHeaders() }
      );
    } else if (!action) {
      // Default health check endpoint
      const health = await HealthCheckService.getSystemHealth();

      return NextResponse.json(
        {
          success: true,
          status: health.overall,
          timestamp: health.timestamp,
          uptime: (100 - health.errorRate).toFixed(2) + '%',
        },
        { status: 200, headers: securityHeaders() }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400, headers: securityHeaders() }
      );
    }
  } catch (error) {
    console.error('Error in GET /api/health:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}
