/**
 * Real-time WebSocket API Routes
 *
 * WebSocket /api/realtime
 * - Connect to real-time events
 * - Typing indicators
 * - Presence updates
 * - Call notifications
 * - Message delivery
 * - Collaborative editing
 */

import { NextRequest, NextResponse } from 'next/server';
import { WebSocketService } from '@/lib/services/websocketService';
import { RealtimeCollaborationService } from '@/lib/services/realtimeCollaborationService';
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

    if (action === 'register') {
      const { userId, roomId } = body;

      if (!userId || !roomId) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const connectionId = await WebSocketService.registerConnection(userId, roomId);
      const participants = await WebSocketService.getRoomParticipants(roomId);

      return NextResponse.json(
        {
          success: true,
          data: {
            connectionId,
            roomId,
            participants,
          },
        },
        { status: 201, headers: securityHeaders() }
      );
    } else if (action === 'typing') {
      const { userId, conversationId, isTyping } = body;

      if (!userId || !conversationId) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      if (isTyping) {
        await WebSocketService.sendTypingIndicator(userId, conversationId);
      } else {
        await WebSocketService.clearTypingIndicator(userId, conversationId);
      }

      return NextResponse.json(
        { success: true },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'update-document') {
      const {
        documentId,
        userId,
        operation,
        position,
        content,
        length,
      } = body;

      if (!documentId || !userId || !operation || typeof position !== 'number') {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const change = await RealtimeCollaborationService.applyChange(
        documentId,
        userId,
        operation,
        position,
        content,
        length
      );

      return NextResponse.json(
        { success: true, data: change },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'cursor-position') {
      const { documentId, userId, position, selection } = body;

      if (!documentId || !userId || typeof position !== 'number') {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      await RealtimeCollaborationService.updateCursorPosition(
        userId,
        documentId,
        position,
        selection
      );

      return NextResponse.json(
        { success: true },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'screen-share-start') {
      const { userId, conversationId } = body;

      if (!userId || !conversationId) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const share = await RealtimeCollaborationService.startScreenShare(userId, conversationId);

      return NextResponse.json(
        { success: true, data: share },
        { status: 201, headers: securityHeaders() }
      );
    } else if (action === 'screen-share-end') {
      const { shareId, recordingUrl } = body;

      if (!shareId) {
        return NextResponse.json(
          { success: false, error: 'Missing share ID' },
          { status: 400, headers: securityHeaders() }
        );
      }

      await RealtimeCollaborationService.endScreenShare(shareId, recordingUrl);

      return NextResponse.json(
        { success: true },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'activity') {
      const { connectionId } = body;

      if (!connectionId) {
        return NextResponse.json(
          { success: false, error: 'Missing connection ID' },
          { status: 400, headers: securityHeaders() }
        );
      }

      await WebSocketService.updateActivity(connectionId);

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
    console.error('Error in POST /api/realtime:', error);
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
    const documentId = req.nextUrl.searchParams.get('documentId');
    const conversationId = req.nextUrl.searchParams.get('conversationId');
    const roomId = req.nextUrl.searchParams.get('roomId');

    if (action === 'typing-users') {
      if (!conversationId) {
        return NextResponse.json(
          { success: false, error: 'Missing conversation ID' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const typingUsers = await WebSocketService.getTypingUsers(conversationId);

      return NextResponse.json(
        { success: true, data: { typingUsers } },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'cursors') {
      if (!documentId) {
        return NextResponse.json(
          { success: false, error: 'Missing document ID' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const cursors = await RealtimeCollaborationService.getCursorPositions(documentId);

      return NextResponse.json(
        { success: true, data: { cursors } },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'participants') {
      if (!roomId) {
        return NextResponse.json(
          { success: false, error: 'Missing room ID' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const participants = await WebSocketService.getRoomParticipants(roomId);
      const connectionCount = await WebSocketService.getRoomConnectionCount(roomId);

      return NextResponse.json(
        { success: true, data: { participants, connectionCount } },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'statistics') {
      const stats = await WebSocketService.getWSStatistics();

      return NextResponse.json(
        { success: true, data: stats },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'screen-shares') {
      if (!conversationId) {
        return NextResponse.json(
          { success: false, error: 'Missing conversation ID' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const screenShares = await RealtimeCollaborationService.getActiveScreenShares(conversationId);

      return NextResponse.json(
        { success: true, data: { screenShares } },
        { status: 200, headers: securityHeaders() }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400, headers: securityHeaders() }
      );
    }
  } catch (error) {
    console.error('Error in GET /api/realtime:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}
