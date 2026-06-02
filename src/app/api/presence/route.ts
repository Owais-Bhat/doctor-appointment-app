/**
 * Presence API Routes
 *
 * POST /api/presence                      - Set status or location
 * GET  /api/presence                      - Get user presence
 * GET  /api/presence/clinic               - Get users in clinic
 * GET  /api/presence/room                 - Get users in room
 * POST /api/presence/activity             - Update last activity
 * GET  /api/presence/summary              - Organization summary
 */

import { NextRequest, NextResponse } from 'next/server';
import { PresenceService } from '@/lib/services/presenceService';
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

    if (action === 'set-status') {
      const { userId, status } = body;

      if (!userId || !status) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      if (!['online', 'away', 'do_not_disturb', 'offline'].includes(status)) {
        return NextResponse.json(
          { success: false, error: 'Invalid status' },
          { status: 400, headers: securityHeaders() }
        );
      }

      await PresenceService.setStatus(userId, status);

      return NextResponse.json(
        { success: true },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'set-location') {
      const { userId, clinic, room } = body;

      if (!userId) {
        return NextResponse.json(
          { success: false, error: 'Missing user ID' },
          { status: 400, headers: securityHeaders() }
        );
      }

      await PresenceService.setLocation(userId, clinic, room);

      return NextResponse.json(
        { success: true },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'update-activity') {
      const { userId } = body;

      if (!userId) {
        return NextResponse.json(
          { success: false, error: 'Missing user ID' },
          { status: 400, headers: securityHeaders() }
        );
      }

      await PresenceService.updateActivity(userId);

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
    console.error('Error in POST /api/presence:', error);
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

    const action = req.nextUrl.searchParams.get('action');
    const userId = req.nextUrl.searchParams.get('userId');
    const userIds = req.nextUrl.searchParams.getAll('userIds[]');
    const clinicId = req.nextUrl.searchParams.get('clinicId');
    const roomId = req.nextUrl.searchParams.get('roomId');

    if (action === 'summary') {
      const summary = await PresenceService.getOrganizationPresenceSummary();

      return NextResponse.json(
        { success: true, data: summary },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'clinic') {
      if (!clinicId) {
        return NextResponse.json(
          { success: false, error: 'Missing clinic ID' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const users = await PresenceService.getUsersInClinic(clinicId);

      return NextResponse.json(
        { success: true, data: { users } },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'room') {
      if (!clinicId || !roomId) {
        return NextResponse.json(
          { success: false, error: 'Missing clinic ID or room ID' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const users = await PresenceService.getUsersInRoom(clinicId, roomId);

      return NextResponse.json(
        { success: true, data: { users } },
        { status: 200, headers: securityHeaders() }
      );
    } else if (userId) {
      const presence = await PresenceService.getPresence(userId);

      return NextResponse.json(
        { success: true, data: presence },
        { status: 200, headers: securityHeaders() }
      );
    } else if (userIds.length > 0) {
      const presences = await PresenceService.getPresences(userIds);

      return NextResponse.json(
        { success: true, data: presences },
        { status: 200, headers: securityHeaders() }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400, headers: securityHeaders() }
      );
    }
  } catch (error) {
    console.error('Error in GET /api/presence:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}
