/**
 * Third-Party Apps Management API Routes
 *
 * POST /api/third-party-apps           - Register app
 * GET  /api/third-party-apps           - List apps
 * GET  /api/third-party-apps/[id]      - Get app
 * PATCH /api/third-party-apps/[id]     - Update app
 * POST /api/third-party-apps/[id]/regenerate-secret - Regenerate client secret
 * DELETE /api/third-party-apps/[id]    - Deactivate app
 */

import { NextRequest, NextResponse } from 'next/server';
import { ThirdPartyAppService } from '@/lib/services/thirdPartyAppService';
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
    const {
      organizationId,
      name,
      websiteUrl,
      contactEmail,
      redirectUris,
      scopes,
      description,
      logoUrl,
    } = body;

    if (!organizationId || !name || !websiteUrl || !contactEmail || !redirectUris || !scopes) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400, headers: securityHeaders() }
      );
    }

    const result = await ThirdPartyAppService.registerApp(
      organizationId,
      name,
      websiteUrl,
      contactEmail,
      redirectUris,
      scopes,
      description,
      logoUrl
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          id: result.app.id,
          clientId: result.app.clientId,
          clientSecret: result.clientSecret,
          name: result.app.name,
          message: 'App registered. Save credentials securely.',
        },
      },
      { status: 201, headers: securityHeaders() }
    );
  } catch (error) {
    console.error('Error in POST /api/third-party-apps:', error);
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

    const organizationId = req.nextUrl.searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'organizationId is required' },
        { status: 400, headers: securityHeaders() }
      );
    }

    const apps = await ThirdPartyAppService.listOrganizationApps(organizationId);

    return NextResponse.json(
      {
        success: true,
        data: apps.map((app) => ({
          id: app.id,
          name: app.name,
          clientId: app.clientId,
          redirectUris: app.redirectUris,
          scopes: app.scopes,
          isActive: app.isActive,
          createdAt: app.createdAt,
          updatedAt: app.updatedAt,
        })),
      },
      { status: 200, headers: securityHeaders() }
    );
  } catch (error) {
    console.error('Error in GET /api/third-party-apps:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}
