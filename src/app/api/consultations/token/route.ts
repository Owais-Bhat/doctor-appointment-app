/**
 * Consultation Token API
 *
 * POST /api/consultations/token - Generate video session token
 */

import { NextRequest, NextResponse } from 'next/server';
import { consultationService } from '@/lib/services/consultationService';
import { setSecurityHeaders } from '@/lib/middleware/securityHeaders';
import { logAuditEvent } from '@/lib/audit/logger';
import { successResponse, errorResponse, ApiErrors } from '@/lib/api/response';

/**
 * Generate session token
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('user-id');
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const data = await request.json();

    if (!userId || !data.sessionId) {
      return NextResponse.json(
        errorResponse(ApiErrors.validationError),
        { status: 400 }
      );
    }

    // Verify session exists and user is participant
    const session = await consultationService.getSession(data.sessionId, userId);
    if (!session) {
      return NextResponse.json(
        errorResponse(ApiErrors.unauthorized),
        { status: 401 }
      );
    }

    // Generate token
    const token = consultationService.generateSessionToken(
      data.sessionId,
      userId,
      ipAddress
    );

    const response = new NextResponse(
      JSON.stringify(
        successResponse(
          {
            token: token.token,
            expiresAt: token.expiresAt,
            sessionId: token.sessionId,
          },
          {
            message: 'Session token generated',
          }
        )
      )
    );

    setSecurityHeaders(response.headers, 'production');
    return response;
  } catch (error) {
    console.error('Error generating token:', error);

    return NextResponse.json(
      errorResponse({
        code: 'TOKEN_ERROR',
        message: 'Failed to generate session token',
      }),
      { status: 500 }
    );
  }
}
