/**
 * Eligibility Check API Routes
 *
 * POST /api/eligibility           - Check eligibility
 * GET  /api/eligibility           - Get eligibility status
 * POST /api/eligibility/refresh   - Refresh eligibility check
 */

import { NextRequest, NextResponse } from 'next/server';
import { EligibilityService } from '@/lib/services/eligibilityService';
import { rateLimit } from '@/lib/middleware/rateLimiter';
import { securityHeaders } from '@/lib/middleware/securityHeaders';

/**
 * POST /api/eligibility
 * Check or refresh eligibility
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
    const { patientId, planId } = body;
    const userId = 'user_123'; // TODO: Get from session
    const ipAddress = req.headers.get('x-forwarded-for');

    if (!patientId || !planId) {
      return NextResponse.json(
        { success: false, error: 'patientId and planId are required' },
        { status: 400, headers: securityHeaders() }
      );
    }

    const result = await EligibilityService.checkEligibility(
      patientId,
      planId,
      userId,
      ipAddress
    );

    return NextResponse.json(result.body, {
      status: result.status,
      headers: securityHeaders(),
    });
  } catch (error) {
    console.error('Error in POST /api/eligibility:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}

/**
 * GET /api/eligibility
 * Get eligibility details and benefits
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

    const patientId = req.nextUrl.searchParams.get('patientId');
    const planId = req.nextUrl.searchParams.get('planId');
    const userId = 'user_123'; // TODO: Get from session

    if (!patientId || !planId) {
      return NextResponse.json(
        { success: false, error: 'patientId and planId are required' },
        { status: 400, headers: securityHeaders() }
      );
    }

    const result = await EligibilityService.getEligibilityBenefits(
      patientId,
      planId,
      userId
    );

    return NextResponse.json(result.body, {
      status: result.status,
      headers: securityHeaders(),
    });
  } catch (error) {
    console.error('Error in GET /api/eligibility:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}
