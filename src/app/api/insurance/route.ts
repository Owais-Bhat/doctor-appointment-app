/**
 * Insurance Plans API Routes
 *
 * POST   /api/insurance           - Add insurance plan
 * GET    /api/insurance           - Get patient's insurance plans
 * PATCH  /api/insurance/[id]      - Update insurance plan
 * DELETE /api/insurance/[id]      - Remove insurance plan
 */

import { NextRequest, NextResponse } from 'next/server';
import { InsuranceService } from '@/lib/services/insuranceService';
import { rateLimit } from '@/lib/middleware/rateLimiter';
import { securityHeaders } from '@/lib/middleware/securityHeaders';

/**
 * POST /api/insurance
 * Add insurance plan for patient
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
    const patientId = body.patientId || 'patient_123'; // TODO: Get from session
    const userId = 'user_123'; // TODO: Get from session
    const ipAddress = req.headers.get('x-forwarded-for');

    const result = await InsuranceService.addInsurancePlan(
      patientId,
      body,
      userId,
      ipAddress
    );

    return NextResponse.json(result.body, {
      status: result.status,
      headers: securityHeaders(),
    });
  } catch (error) {
    console.error('Error in POST /api/insurance:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}

/**
 * GET /api/insurance
 * Get patient's insurance plans
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

    const patientId = req.nextUrl.searchParams.get('patientId') || 'patient_123';
    const userId = 'user_123'; // TODO: Get from session

    const result = await InsuranceService.getPatientInsurancePlans(patientId, userId);

    return NextResponse.json(result.body, {
      status: result.status,
      headers: securityHeaders(),
    });
  } catch (error) {
    console.error('Error in GET /api/insurance:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}
