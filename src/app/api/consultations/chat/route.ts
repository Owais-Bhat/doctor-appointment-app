/**
 * Consultation Chat API
 *
 * POST /api/consultations/chat - Send chat message
 * GET /api/consultations/chat - Get message history
 */

import { NextRequest, NextResponse } from 'next/server';
import { chatManager } from '@/lib/video/chatManager';
import { setSecurityHeaders } from '@/lib/middleware/securityHeaders';
import { logAuditEvent } from '@/lib/audit/logger';
import { successResponse, errorResponse, ApiErrors } from '@/lib/api/response';

/**
 * Send chat message
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('user-id');
    const userName = request.headers.get('user-name') || 'Anonymous';
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const data = await request.json();

    if (!userId || !data.sessionId || !data.message) {
      return NextResponse.json(
        errorResponse(ApiErrors.validationError),
        { status: 400 }
      );
    }

    // Initialize chat if needed
    if (!chatManager) {
      throw new Error('Chat manager not initialized');
    }

    chatManager.initialize(data.sessionId);

    // Send message
    const message = chatManager.sendMessage(
      data.sessionId,
      userId,
      userName,
      data.message
    );

    // Log audit event
    await logAuditEvent({
      action: 'CONSULTATION_MESSAGE_SENT',
      resourceType: 'consultation',
      resourceId: data.sessionId,
      userId,
      ipAddress,
      details: {
        messageLength: data.message.length,
      },
    });

    const response = new NextResponse(
      JSON.stringify(
        successResponse(message, {
          message: 'Message sent',
        })
      )
    );

    setSecurityHeaders(response.headers, 'production');
    return response;
  } catch (error) {
    console.error('Error sending message:', error);

    return NextResponse.json(
      errorResponse({
        code: 'MESSAGE_ERROR',
        message: 'Failed to send message',
      }),
      { status: 500 }
    );
  }
}

/**
 * Get message history
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('user-id');
    const sessionId = request.nextUrl.searchParams.get('sessionId');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '100');

    if (!userId || !sessionId) {
      return NextResponse.json(
        errorResponse(ApiErrors.validationError),
        { status: 400 }
      );
    }

    // Initialize chat
    chatManager.initialize(sessionId);

    // Get history
    const messages = chatManager.getMessageHistory(sessionId, limit);

    const response = new NextResponse(
      JSON.stringify(
        successResponse({
          sessionId,
          messages,
          totalMessages: messages.length,
          unreadCount: chatManager.getUnreadCount(sessionId),
        })
      )
    );

    setSecurityHeaders(response.headers, 'production');
    return response;
  } catch (error) {
    console.error('Error getting message history:', error);

    return NextResponse.json(
      errorResponse({
        code: 'MESSAGE_ERROR',
        message: 'Failed to retrieve message history',
      }),
      { status: 500 }
    );
  }
}
