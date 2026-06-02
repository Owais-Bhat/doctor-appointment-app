/**
 * Webhooks Management API Routes
 *
 * POST /api/webhooks                  - Register webhook
 * GET  /api/webhooks                  - List webhooks
 * GET  /api/webhooks/[id]             - Get webhook
 * PATCH /api/webhooks/[id]            - Update webhook
 * POST /api/webhooks/[id]/test        - Test webhook
 * POST /api/webhooks/[id]/events      - Get event history
 * DELETE /api/webhooks/[id]           - Delete webhook
 * POST /api/webhooks/events/[id]/retry - Retry failed event
 */

import { NextRequest, NextResponse } from 'next/server';
import { WebhookService } from '@/lib/services/webhookService';
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
    const { organizationId, appId, url, events, action, retryPolicy } = body;

    if (action === 'register') {
      if (!organizationId || !appId || !url || !events || events.length === 0) {
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

      const result = await WebhookService.registerWebhook(
        organizationId,
        appId,
        url,
        events,
        retryPolicy
      );

      return NextResponse.json(
        {
          success: true,
          data: {
            id: result.webhook.id,
            secret: result.secret,
            message: 'Webhook registered. Save the secret securely.',
          },
        },
        { status: 201, headers: securityHeaders() }
      );
    } else if (action === 'test') {
      const { webhookId } = body;

      if (!webhookId) {
        return NextResponse.json(
          { success: false, error: 'webhookId is required' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const result = await WebhookService.testWebhook(webhookId);

      return NextResponse.json(
        { success: true, data: result },
        { status: 200, headers: securityHeaders() }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400, headers: securityHeaders() }
      );
    }
  } catch (error) {
    console.error('Error in POST /api/webhooks:', error);
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

    const webhooks = await WebhookService.listWebhooks(organizationId, appId);

    return NextResponse.json(
      {
        success: true,
        data: webhooks.map((w) => ({
          id: w.id,
          url: w.url,
          events: w.events,
          isActive: w.isActive,
          createdAt: w.createdAt,
          updatedAt: w.updatedAt,
        })),
      },
      { status: 200, headers: securityHeaders() }
    );
  } catch (error) {
    console.error('Error in GET /api/webhooks:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}
