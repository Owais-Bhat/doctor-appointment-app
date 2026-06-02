/**
 * Analytics API Routes
 *
 * GET /api/analytics/revenue        - Revenue metrics
 * GET /api/analytics/operational    - Operational metrics
 * GET /api/analytics/clinical       - Clinical metrics
 * GET /api/analytics/benchmarks     - Benchmarking data
 * GET /api/analytics/reports        - Reports management
 */

import { NextRequest, NextResponse } from 'next/server';
import { RevenueAnalyticsService } from '@/lib/services/revenueAnalyticsService';
import { OperationalAnalyticsService } from '@/lib/services/operationalAnalyticsService';
import { ClinicalAnalyticsService } from '@/lib/services/clinicalAnalyticsService';
import { BenchmarkingService } from '@/lib/services/benchmarkingService';
import { rateLimit } from '@/lib/middleware/rateLimiter';
import { securityHeaders } from '@/lib/middleware/securityHeaders';

/**
 * GET /api/analytics
 * Get analytics based on query parameters
 */
export async function GET(req: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(req, 'general');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429, headers: securityHeaders() }
      );
    }

    const type = req.nextUrl.searchParams.get('type');
    const organizationId = req.nextUrl.searchParams.get('organizationId') || 'org_123';
    const period = req.nextUrl.searchParams.get('period') || new Date().toISOString().slice(0, 7);
    const userId = 'user_123'; // TODO: Get from session

    switch (type) {
      case 'revenue':
        return handleRevenueAnalytics(organizationId, period, userId);
      case 'operational':
        return handleOperationalAnalytics(organizationId, period, userId);
      case 'clinical':
        return handleClinicalAnalytics(organizationId, period, userId);
      case 'benchmarks':
        return handleBenchmarks(organizationId, userId);
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid analytics type' },
          { status: 400, headers: securityHeaders() }
        );
    }
  } catch (error) {
    console.error('Error in GET /api/analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}

async function handleRevenueAnalytics(
  organizationId: string,
  period: string,
  userId: string
) {
  const result = await RevenueAnalyticsService.getRevenueMetrics(
    organizationId,
    period,
    userId
  );
  return NextResponse.json(result.body, {
    status: result.status,
    headers: securityHeaders(),
  });
}

async function handleOperationalAnalytics(
  organizationId: string,
  period: string,
  userId: string
) {
  const result = await OperationalAnalyticsService.getOperationalMetrics(
    organizationId,
    period,
    userId
  );
  return NextResponse.json(result.body, {
    status: result.status,
    headers: securityHeaders(),
  });
}

async function handleClinicalAnalytics(
  organizationId: string,
  period: string,
  userId: string
) {
  const result = await ClinicalAnalyticsService.getClinicalMetrics(
    organizationId,
    period,
    userId
  );
  return NextResponse.json(result.body, {
    status: result.status,
    headers: securityHeaders(),
  });
}

async function handleBenchmarks(organizationId: string, userId: string) {
  const result = await BenchmarkingService.getAllBenchmarks(organizationId, userId);
  return NextResponse.json(result.body, {
    status: result.status,
    headers: securityHeaders(),
  });
}
