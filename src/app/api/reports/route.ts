/**
 * Reports API Routes
 *
 * POST /api/reports            - Create custom report
 * GET  /api/reports            - Get organization reports
 * POST /api/reports/[id]/run   - Run/generate report
 * POST /api/reports/[id]/export - Export report
 */

import { NextRequest, NextResponse } from 'next/server';
import { ReportBuilderService } from '@/lib/services/reportBuilderService';
import { rateLimit } from '@/lib/middleware/rateLimiter';
import { securityHeaders } from '@/lib/middleware/securityHeaders';

/**
 * POST /api/reports
 * Create new custom report
 */
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
    const { organizationId, action } = body;
    const userId = 'user_123'; // TODO: Get from session
    const ipAddress = req.headers.get('x-forwarded-for');

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'organizationId is required' },
        { status: 400, headers: securityHeaders() }
      );
    }

    // Handle different actions
    if (action === 'create') {
      const result = await ReportBuilderService.createReport(
        organizationId,
        body,
        userId,
        ipAddress
      );

      return NextResponse.json(result.body, {
        status: result.status,
        headers: securityHeaders(),
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400, headers: securityHeaders() }
    );
  } catch (error) {
    console.error('Error in POST /api/reports:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}

/**
 * GET /api/reports
 * Get organization reports
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

    const organizationId = req.nextUrl.searchParams.get('organizationId');
    const userId = 'user_123'; // TODO: Get from session

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'organizationId is required' },
        { status: 400, headers: securityHeaders() }
      );
    }

    const result = await ReportBuilderService.getOrganizationReports(
      organizationId,
      userId
    );

    return NextResponse.json(result.body, {
      status: result.status,
      headers: securityHeaders(),
    });
  } catch (error) {
    console.error('Error in GET /api/reports:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}
