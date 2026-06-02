/**
 * Clinics API Routes
 *
 * POST   /api/clinics           - Create clinic
 * GET    /api/clinics           - Get organization clinics
 * GET    /api/clinics/[id]      - Get specific clinic
 * PATCH  /api/clinics/[id]      - Update clinic
 */

import { NextRequest, NextResponse } from 'next/server';
import { ClinicService } from '@/lib/services/clinicService';
import { rateLimit } from '@/lib/middleware/rateLimiter';
import { securityHeaders } from '@/lib/middleware/securityHeaders';

/**
 * POST /api/clinics
 * Create new clinic
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
    const { organizationId } = body;
    const userId = 'user_123'; // TODO: Get from session
    const ipAddress = req.headers.get('x-forwarded-for');

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'organizationId is required' },
        { status: 400, headers: securityHeaders() }
      );
    }

    const result = await ClinicService.createClinic(
      organizationId,
      body,
      userId,
      ipAddress
    );

    return NextResponse.json(result.body, {
      status: result.status,
      headers: securityHeaders(),
    });
  } catch (error) {
    console.error('Error in POST /api/clinics:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}

/**
 * GET /api/clinics
 * Get organization clinics
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

    const result = await ClinicService.getOrganizationClinics(
      organizationId,
      userId
    );

    return NextResponse.json(result.body, {
      status: result.status,
      headers: securityHeaders(),
    });
  } catch (error) {
    console.error('Error in GET /api/clinics:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}
