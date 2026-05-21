/**
 * Consultations API
 *
 * POST /api/consultations - Create new consultation session
 * GET /api/consultations/[sessionId] - Get session details
 */

import { NextRequest, NextResponse } from 'next/server';
import { consultationService } from '@/lib/services/consultationService';
import { checkRateLimitByUser } from '@/lib/middleware/rateLimiter';
import { setSecurityHeaders } from '@/lib/middleware/securityHeaders';
import { logAuditEvent, logSecurityEvent } from '@/lib/audit/logger';
import { successResponse, errorResponse, ApiErrors } from '@/lib/api/response';

/**
 * Create consultation session
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('user-id');
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const data = await request.json();

    // Validate required fields
    if (!userId || !data.appointmentId || !data.doctorId || !data.patientId) {
      return NextResponse.json(
        errorResponse(ApiErrors.validationError),
        { status: 400 }
      );
    }

    // Rate limit check
    const rateLimitResult = await checkRateLimitByUser(userId, 10, 60000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        errorResponse(ApiErrors.rateLimitExceeded),
        { status: 429 }
      );
    }

    // Create consultation
    const session = await consultationService.createSession(
      data.appointmentId,
      data.doctorId,
      data.patientId,
      data.recordingConsent || false,
      userId,
      ipAddress
    );

    const response = new NextResponse(
      JSON.stringify(
        successResponse(session, {
          statusCode: 201,
          message: 'Consultation session created',
        })
      ),
      { status: 201 }
    );

    setSecurityHeaders(response.headers, 'production');
    return response;
  } catch (error) {
    console.error('Error creating consultation:', error);

    return NextResponse.json(
      errorResponse({
        code: 'CONSULTATION_ERROR',
        message: 'Failed to create consultation session',
      }),
      { status: 500 }
    );
  }
}

/**
 * Get consultation session
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('user-id');
    const sessionId = request.nextUrl.searchParams.get('sessionId');

    if (!userId || !sessionId) {
      return NextResponse.json(
        errorResponse(ApiErrors.validationError),
        { status: 400 }
      );
    }

    // Get consultation
    const session = await consultationService.getSession(sessionId, userId);

    if (!session) {
      return NextResponse.json(
        errorResponse(ApiErrors.notFound),
        { status: 404 }
      );
    }

    const response = new NextResponse(
      JSON.stringify(successResponse(session))
    );

    setSecurityHeaders(response.headers, 'production');
    return response;
  } catch (error) {
    console.error('Error getting consultation:', error);

    return NextResponse.json(
      errorResponse({
        code: 'CONSULTATION_ERROR',
        message: 'Failed to retrieve consultation session',
      }),
      { status: 500 }
    );
  }
}
