/**
 * Metrics API Routes
 *
 * POST /api/metrics
 * - action: record-metric - Record performance metric
 * - action: record-service - Record service metrics
 * - action: set-threshold - Set performance threshold
 *
 * GET /api/metrics
 * - action: metrics - Get specific metrics
 * - action: service - Get service metrics
 * - action: summary - Get metrics summary
 * - action: report - Generate performance report
 */

import { NextRequest, NextResponse } from 'next/server';
import { PerformanceMonitoringService } from '@/lib/services/performanceMonitoringService';
import { rateLimit } from '@/lib/middleware/rateLimiter';
import { securityHeaders } from '@/lib/middleware/securityHeaders';

export async function POST(req: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(req, 'general');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429, headers: securityHeaders() }
      );
    }

    const body = await req.json();
    const { action } = body;

    if (action === 'record-metric') {
      const { name, value, unit, tags } = body;

      if (!name || typeof value !== 'number') {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const metric = await PerformanceMonitoringService.recordMetric(
        name,
        value,
        unit || 'ms',
        tags || {}
      );

      return NextResponse.json(
        { success: true, data: metric },
        { status: 201, headers: securityHeaders() }
      );
    } else if (action === 'record-service') {
      const { serviceName, requestCount, errorCount, responseTimes } = body;

      if (!serviceName || typeof requestCount !== 'number' || !Array.isArray(responseTimes)) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const metrics = await PerformanceMonitoringService.recordServiceMetrics(
        serviceName,
        requestCount,
        errorCount || 0,
        responseTimes
      );

      return NextResponse.json(
        { success: true, data: metrics },
        { status: 201, headers: securityHeaders() }
      );
    } else if (action === 'set-threshold') {
      const { metric, threshold, unit } = body;

      if (!metric || typeof threshold !== 'number') {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      await PerformanceMonitoringService.setPerformanceThreshold(metric, threshold, unit || 'ms');

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
    console.error('Error in POST /api/metrics:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(req, 'general');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429, headers: securityHeaders() }
      );
    }

    const action = req.nextUrl.searchParams.get('action');
    const name = req.nextUrl.searchParams.get('name');
    const serviceName = req.nextUrl.searchParams.get('serviceName');

    if (action === 'metrics') {
      if (!name) {
        return NextResponse.json(
          { success: false, error: 'Missing metric name' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const metrics = await PerformanceMonitoringService.getMetrics(name);

      return NextResponse.json(
        { success: true, data: { metrics } },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'service') {
      if (!serviceName) {
        return NextResponse.json(
          { success: false, error: 'Missing service name' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const metrics = await PerformanceMonitoringService.getServiceMetrics(serviceName);

      return NextResponse.json(
        { success: true, data: metrics },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'summary') {
      const summary = await PerformanceMonitoringService.getMetricsSummary();

      return NextResponse.json(
        { success: true, data: summary },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'report') {
      const report = await PerformanceMonitoringService.generatePerformanceReport();

      return NextResponse.json(
        { success: true, data: report },
        { status: 200, headers: securityHeaders() }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400, headers: securityHeaders() }
      );
    }
  } catch (error) {
    console.error('Error in GET /api/metrics:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}
