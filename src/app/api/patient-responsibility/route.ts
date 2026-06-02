/**
 * Patient Responsibility API Routes
 *
 * POST /api/patient-responsibility              - Estimate cost
 * GET  /api/patient-responsibility              - Get responsibility summary
 * POST /api/patient-responsibility/[id]/payment - Record payment
 */

import { NextRequest, NextResponse } from 'next/server';
import { PatientResponsibilityService } from '@/lib/services/patientResponsibilityService';
import { rateLimit } from '@/lib/middleware/rateLimiter';
import { securityHeaders } from '@/lib/middleware/securityHeaders';

/**
 * POST /api/patient-responsibility
 * Estimate patient responsibility or finalize after service
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
    const { patientId, appointmentId, planId, action, serviceCharges, actualCharges, actualAllowedAmount } = body;
    const userId = 'user_123'; // TODO: Get from session
    const ipAddress = req.headers.get('x-forwarded-for');

    if (!patientId || !appointmentId) {
      return NextResponse.json(
        { success: false, error: 'patientId and appointmentId are required' },
        { status: 400, headers: securityHeaders() }
      );
    }

    if (action === 'estimate') {
      if (!planId || !serviceCharges) {
        return NextResponse.json(
          { success: false, error: 'planId and serviceCharges are required for estimate' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const result = await PatientResponsibilityService.estimateResponsibility(
        appointmentId,
        patientId,
        planId,
        serviceCharges,
        userId
      );

      return NextResponse.json(result.body, {
        status: result.status,
        headers: securityHeaders(),
      });
    }

    if (action === 'finalize') {
      if (!actualCharges || actualAllowedAmount === undefined) {
        return NextResponse.json(
          { success: false, error: 'actualCharges and actualAllowedAmount are required for finalize' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const result = await PatientResponsibilityService.finalizeResponsibility(
        appointmentId,
        patientId,
        actualCharges,
        actualAllowedAmount,
        userId,
        ipAddress
      );

      return NextResponse.json(result.body, {
        status: result.status,
        headers: securityHeaders(),
      });
    }

    return NextResponse.json(
      { success: false, error: 'action must be "estimate" or "finalize"' },
      { status: 400, headers: securityHeaders() }
    );
  } catch (error) {
    console.error('Error in POST /api/patient-responsibility:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}

/**
 * GET /api/patient-responsibility
 * Get patient responsibility summary
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

    const patientId = req.nextUrl.searchParams.get('patientId');
    const userId = 'user_123'; // TODO: Get from session

    if (!patientId) {
      return NextResponse.json(
        { success: false, error: 'patientId is required' },
        { status: 400, headers: securityHeaders() }
      );
    }

    const result = await PatientResponsibilityService.getResponsibilitySummary(patientId, userId);

    return NextResponse.json(result.body, {
      status: result.status,
      headers: securityHeaders(),
    });
  } catch (error) {
    console.error('Error in GET /api/patient-responsibility:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}
