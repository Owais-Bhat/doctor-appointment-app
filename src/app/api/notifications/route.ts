/**
 * Notifications API Routes
 *
 * POST /api/notifications                 - Send notification or register push token
 * GET  /api/notifications                 - Get user notifications
 * POST /api/notifications/[id]/read       - Mark as read
 * DELETE /api/notifications/[id]          - Delete notification
 * GET  /api/notifications/unread-count    - Get unread count
 */

import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/lib/services/notificationService';
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

    if (action === 'send') {
      const {
        recipientId,
        organizationId,
        type,
        title,
        message,
        channels,
        senderId,
        actionUrl,
        actionLabel,
        resourceType,
        resourceId,
        priority,
      } = body;

      if (!recipientId || !organizationId || !type || !title || !message) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const notification = await NotificationService.sendNotification(
        recipientId,
        organizationId,
        type,
        title,
        message,
        channels || ['in_app'],
        {
          senderId,
          actionUrl,
          actionLabel,
          resourceType,
          resourceId,
          priority,
        }
      );

      return NextResponse.json(
        { success: true, data: { id: notification.id } },
        { status: 201, headers: securityHeaders() }
      );
    } else if (action === 'register-push-token') {
      const { userId, deviceId, platform, token, expiresAt } = body;

      if (!userId || !deviceId || !platform || !token) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      await NotificationService.registerPushToken(
        userId,
        deviceId,
        platform,
        token,
        expiresAt ? new Date(expiresAt) : undefined
      );

      return NextResponse.json(
        { success: true },
        { status: 201, headers: securityHeaders() }
      );
    } else if (action === 'mark-read') {
      const { notificationId } = body;

      if (!notificationId) {
        return NextResponse.json(
          { success: false, error: 'Missing notification ID' },
          { status: 400, headers: securityHeaders() }
        );
      }

      await NotificationService.markNotificationAsRead(notificationId);

      return NextResponse.json(
        { success: true },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'mark-all-read') {
      const { userId, organizationId } = body;

      if (!userId || !organizationId) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      await NotificationService.markAllAsRead(userId, organizationId);

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
    console.error('Error in POST /api/notifications:', error);
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

    const userId = req.nextUrl.searchParams.get('userId');
    const organizationId = req.nextUrl.searchParams.get('organizationId');
    const action = req.nextUrl.searchParams.get('action');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');

    if (action === 'unread-count') {
      if (!userId || !organizationId) {
        return NextResponse.json(
          { success: false, error: 'Missing required parameters' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const unreadCount = await NotificationService.getUnreadCount(userId, organizationId);

      return NextResponse.json(
        { success: true, data: { unreadCount } },
        { status: 200, headers: securityHeaders() }
      );
    } else if (userId && organizationId) {
      const unreadOnly = req.nextUrl.searchParams.get('unreadOnly') === 'true';

      const notifications = await NotificationService.getUserNotifications(
        userId,
        organizationId,
        limit,
        unreadOnly
      );

      return NextResponse.json(
        { success: true, data: notifications },
        { status: 200, headers: securityHeaders() }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400, headers: securityHeaders() }
      );
    }
  } catch (error) {
    console.error('Error in GET /api/notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}
