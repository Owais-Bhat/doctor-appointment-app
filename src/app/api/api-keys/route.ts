/**
 * API Keys Management API Routes
 *
 * POST /api/api-keys              - Create API key
 * GET  /api/api-keys              - List API keys
 * GET  /api/api-keys/[id]         - Get API key
 * PATCH /api/api-keys/[id]        - Update API key
 * POST /api/api-keys/[id]/revoke  - Revoke API key
 */

import { NextRequest, NextResponse } from 'next/server';
import { APIKeyService } from '@/lib/services/apiKeyService';
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
    const { organizationId, appId, name, scopes, rateLimit: apiRateLimit, expiresAt } = body;
    const userId = 'user_123'; // TODO: Get from session

    if (!organizationId || !appId || !name || !scopes || scopes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400, headers: securityHeaders() }
      );
    }

    const app = await ThirdPartyAppService.getAppById(appId);
    if (!app || app.organizationId !== organizationId) {
      return NextResponse.json(
        { success: false, error: 'App not found' },
        { status: 404, headers: securityHeaders() }
      );
    }

    const result = await APIKeyService.generateAPIKey(
      organizationId,
      appId,
      name,
      scopes,
      apiRateLimit || 1000,
      expiresAt ? new Date(expiresAt) : undefined
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          keyId: result.keyId,
          key: result.key,
          message: 'API key created. Save it securely - you won\'t be able to see it again.',
        },
      },
      { status: 201, headers: securityHeaders() }
    );
  } catch (error) {
    console.error('Error in POST /api/api-keys:', error);
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
    const appId = req.nextUrl.searchParams.get('appId');

    if (!organizationId || !appId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400, headers: securityHeaders() }
      );
    }

    const keys = await APIKeyService.listAPIKeys(organizationId, appId);

    return NextResponse.json(
      { success: true, data: keys },
      { status: 200, headers: securityHeaders() }
    );
  } catch (error) {
    console.error('Error in GET /api/api-keys:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}
