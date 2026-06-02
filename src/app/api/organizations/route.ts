/**
 * Organizations API Routes
 *
 * POST   /api/organizations           - Create organization
 * GET    /api/organizations           - Get user's organizations
 * GET    /api/organizations/[id]      - Get specific organization
 * PATCH  /api/organizations/[id]      - Update organization
 */

import { NextRequest, NextResponse } from 'next/server';
import { OrganizationService } from '@/lib/services/organizationService';
import { rateLimit } from '@/lib/middleware/rateLimiter';
import { securityHeaders } from '@/lib/middleware/securityHeaders';

/**
 * GET /api/organizations
 * Get user's organizations
 */
export async function GET(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(req, 'general');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429, headers: securityHeaders() }
      );
    }

    // TODO: Get userId from session
    const userId = 'user_123';

    const result = await OrganizationService.getUserOrganizations(userId);

    return NextResponse.json(result.body, {
      status: result.status,
      headers: securityHeaders(),
    });
  } catch (error) {
    console.error('Error in GET /api/organizations:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}

/**
 * POST /api/organizations
 * Create new organization
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
    const userId = 'user_123'; // TODO: Get from session
    const ipAddress = req.headers.get('x-forwarded-for');

    const result = await OrganizationService.createOrganization(
      body,
      userId,
      ipAddress
    );

    return NextResponse.json(result.body, {
      status: result.status,
      headers: securityHeaders(),
    });
  } catch (error) {
    console.error('Error in POST /api/organizations:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}
