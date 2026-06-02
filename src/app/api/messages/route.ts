/**
 * Messaging API Routes
 *
 * POST /api/messages                      - Send message or create conversation
 * GET  /api/messages                      - Get messages/conversations
 * POST /api/messages/[id]/read            - Mark as read
 * POST /api/messages/[id]/edit            - Edit message
 * DELETE /api/messages/[id]               - Delete message
 * POST /api/messages/[id]/react           - Add reaction
 */

import { NextRequest, NextResponse } from 'next/server';
import { MessagingService } from '@/lib/services/messagingService';
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

    if (action === 'send-message') {
      const {
        conversationId,
        senderId,
        senderType,
        content,
        contentType,
        attachmentUrl,
        attachmentFileName,
        attachmentSize,
      } = body;

      if (!conversationId || !senderId || !content) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const message = await MessagingService.sendMessage(
        conversationId,
        senderId,
        senderType || 'patient',
        content,
        contentType || 'text',
        attachmentUrl,
        attachmentFileName,
        attachmentSize
      );

      return NextResponse.json(
        { success: true, data: message },
        { status: 201, headers: securityHeaders() }
      );
    } else if (action === 'create-conversation') {
      const { organizationId, participantIds, type, title, appointmentId, clinicId } = body;

      if (!organizationId || !participantIds || participantIds.length < 2) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const conversation = await MessagingService.createConversation(
        organizationId,
        participantIds,
        type || 'direct',
        title,
        appointmentId,
        clinicId
      );

      return NextResponse.json(
        { success: true, data: conversation },
        { status: 201, headers: securityHeaders() }
      );
    } else if (action === 'mark-read') {
      const { messageId, userId } = body;

      if (!messageId || !userId) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      await MessagingService.markMessageAsRead(messageId, userId);

      return NextResponse.json(
        { success: true },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'mark-conversation-read') {
      const { conversationId, userId } = body;

      if (!conversationId || !userId) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      await MessagingService.markConversationAsRead(conversationId, userId);

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
    console.error('Error in POST /api/messages:', error);
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
    const conversationId = req.nextUrl.searchParams.get('conversationId');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50');

    if (conversationId) {
      const messages = await MessagingService.getMessages(conversationId, limit);

      return NextResponse.json(
        { success: true, data: messages },
        { status: 200, headers: securityHeaders() }
      );
    } else if (userId && organizationId) {
      const conversations = await MessagingService.getUserConversations(
        userId,
        organizationId,
        limit
      );

      return NextResponse.json(
        { success: true, data: conversations },
        { status: 200, headers: securityHeaders() }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400, headers: securityHeaders() }
      );
    }
  } catch (error) {
    console.error('Error in GET /api/messages:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}
