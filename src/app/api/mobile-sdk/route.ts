/**
 * Mobile SDK Management API Routes
 *
 * POST /api/mobile-sdk/config                    - Create SDK config
 * GET  /api/mobile-sdk/config                    - Get SDK config
 * PATCH /api/mobile-sdk/config                   - Update SDK config
 * GET  /api/mobile-sdk/releases                  - Get release history
 * GET  /api/mobile-sdk/releases/current          - Get current release
 * POST /api/mobile-sdk/releases                  - Create release
 * POST /api/mobile-sdk/check-version             - Check version compatibility
 * GET  /api/mobile-sdk/integration-guide         - Get integration guide
 */

import { NextRequest, NextResponse } from 'next/server';
import { MobileSDKService } from '@/lib/services/mobileSDKService';
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

    if (action === 'create-config') {
      const {
        organizationId,
        appVersion,
        platformVersion,
        features,
        cachePolicy,
      } = body;

      if (!organizationId || !appVersion || !features) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const config = await MobileSDKService.createSDKConfig(
        organizationId,
        appVersion,
        platformVersion || {},
        features,
        cachePolicy
      );

      return NextResponse.json(
        { success: true, data: config },
        { status: 201, headers: securityHeaders() }
      );
    } else if (action === 'create-release') {
      const {
        version,
        platform,
        minimumOSVersion,
        features,
        bugFixes,
      } = body;

      if (!version || !platform || !minimumOSVersion || !features) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const downloadUrl = MobileSDKService.generateSDKDownloadUrl(platform, version);

      const release = await MobileSDKService.createRelease(
        version,
        platform,
        downloadUrl,
        minimumOSVersion,
        features,
        bugFixes
      );

      return NextResponse.json(
        { success: true, data: release },
        { status: 201, headers: securityHeaders() }
      );
    } else if (action === 'check-version') {
      const { platform, currentVersion } = body;

      if (!platform || !currentVersion) {
        return NextResponse.json(
          { success: false, error: 'Missing required parameters' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const result = await MobileSDKService.checkMinimumVersion(platform, currentVersion);

      return NextResponse.json(
        { success: true, data: result },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'log-event') {
      const {
        organizationId,
        userId,
        eventType,
        platform,
        appVersion,
        details,
      } = body;

      if (!organizationId || !userId || !eventType || !platform || !appVersion) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      await MobileSDKService.logSDKEvent(
        organizationId,
        userId,
        eventType,
        platform,
        appVersion,
        details
      );

      return NextResponse.json(
        { success: true },
        { status: 200, headers: securityHeaders() }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400, headers: securityHeaders() }
      );
    }
  } catch (error) {
    console.error('Error in POST /api/mobile-sdk:', error);
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
    const action = req.nextUrl.searchParams.get('action');

    if (action === 'config') {
      if (!organizationId) {
        return NextResponse.json(
          { success: false, error: 'organizationId is required' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const config = await MobileSDKService.getSDKConfig(organizationId);

      return NextResponse.json(
        { success: true, data: config },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'releases') {
      const platform = req.nextUrl.searchParams.get('platform');
      const limit = parseInt(req.nextUrl.searchParams.get('limit') || '10');

      const releases = await MobileSDKService.getReleaseHistory(
        platform as 'ios' | 'android' | undefined,
        limit
      );

      return NextResponse.json(
        { success: true, data: releases },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'current-release') {
      const platform = req.nextUrl.searchParams.get('platform');

      if (!platform || (platform !== 'ios' && platform !== 'android')) {
        return NextResponse.json(
          { success: false, error: 'Invalid platform' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const release = await MobileSDKService.getCurrentRelease(platform as 'ios' | 'android');

      return NextResponse.json(
        { success: true, data: release },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'integration-guide') {
      const platform = req.nextUrl.searchParams.get('platform');

      if (!platform || (platform !== 'ios' && platform !== 'android')) {
        return NextResponse.json(
          { success: false, error: 'Invalid platform' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const guide = await MobileSDKService.getIntegrationGuide(platform as 'ios' | 'android');

      return NextResponse.json(
        { success: true, data: guide },
        { status: 200, headers: securityHeaders() }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400, headers: securityHeaders() }
      );
    }
  } catch (error) {
    console.error('Error in GET /api/mobile-sdk:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}
