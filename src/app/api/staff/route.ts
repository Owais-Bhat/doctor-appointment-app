/**
 * Staff API Routes
 *
 * POST   /api/staff           - Add staff member
 * GET    /api/staff           - Get organization/clinic staff
 * GET    /api/staff/[id]      - Get specific staff member
 * PATCH  /api/staff/[id]      - Update staff member
 * DELETE /api/staff/[id]      - Remove staff member
 */

import { NextRequest, NextResponse } from 'next/server';
import { StaffService } from '@/lib/services/staffService';
import { rateLimit } from '@/lib/middleware/rateLimiter';
import { securityHeaders } from '@/lib/middleware/securityHeaders';

/**
 * POST /api/staff
 * Add staff member to organization
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

    const result = await StaffService.addStaffMember(
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
    console.error('Error in POST /api/staff:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}

/**
 * GET /api/staff
 * Get organization or clinic staff
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
    const clinicId = req.nextUrl.searchParams.get('clinicId');
    const role = req.nextUrl.searchParams.get('role');
    const userId = 'user_123'; // TODO: Get from session

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'organizationId is required' },
        { status: 400, headers: securityHeaders() }
      );
    }

    const result = await StaffService.getOrganizationStaff(
      organizationId,
      userId,
      { role: role || undefined, clinicId: clinicId || undefined }
    );

    return NextResponse.json(result.body, {
      status: result.status,
      headers: securityHeaders(),
    });
  } catch (error) {
    console.error('Error in GET /api/staff:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}
