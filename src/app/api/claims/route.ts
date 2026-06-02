/**
 * Claims API Routes
 *
 * POST   /api/claims              - Create claim
 * GET    /api/claims              - Get claims
 * POST   /api/claims/[id]/submit  - Submit claim
 * POST   /api/claims/[id]/payment - Record payment
 */

import { NextRequest, NextResponse } from 'next/server';
import { ClaimsService } from '@/lib/services/claimsService';
import { rateLimit } from '@/lib/middleware/rateLimiter';
import { securityHeaders } from '@/lib/middleware/securityHeaders';

/**
 * POST /api/claims
 * Create new claim
 */
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
    const { appointmentId } = body;
    const userId = 'user_123'; // TODO: Get from session
    const ipAddress = req.headers.get('x-forwarded-for');

    if (!appointmentId) {
      return NextResponse.json(
        { success: false, error: 'appointmentId is required' },
        { status: 400, headers: securityHeaders() }
      );
    }

    const result = await ClaimsService.createClaim(
      appointmentId,
      body,
      userId,
      ipAddress
    );

    return NextResponse.json(result.body, {
      status: result.status,
      headers: securityHeaders(),
    });
  } catch (error) {
    console.error('Error in POST /api/claims:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}

/**
 * GET /api/claims
 * Get claims for appointment or patient
 */
export async function GET(req: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(req, 'general');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429, headers: securityHeaders() }
      );
    }

    const appointmentId = req.nextUrl.searchParams.get('appointmentId');
    const patientId = req.nextUrl.searchParams.get('patientId');
    const clinicId = req.nextUrl.searchParams.get('clinicId');
    const userId = 'user_123'; // TODO: Get from session

    if (appointmentId) {
      const result = await ClaimsService.getAppointmentClaims(appointmentId, userId);
      return NextResponse.json(result.body, {
        status: result.status,
        headers: securityHeaders(),
      });
    }

    if (patientId) {
      const result = await ClaimsService.getPatientClaims(patientId, userId);
      return NextResponse.json(result.body, {
        status: result.status,
        headers: securityHeaders(),
      });
    }

    if (clinicId) {
      const result = await ClaimsService.getClinicClaims(clinicId, userId);
      return NextResponse.json(result.body, {
        status: result.status,
        headers: securityHeaders(),
      });
    }

    return NextResponse.json(
      { success: false, error: 'appointmentId, patientId, or clinicId is required' },
      { status: 400, headers: securityHeaders() }
    );
  } catch (error) {
    console.error('Error in GET /api/claims:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}
