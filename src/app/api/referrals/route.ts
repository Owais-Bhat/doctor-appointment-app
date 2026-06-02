/**
 * Referrals API Routes
 *
 * POST   /api/referrals           - Create referral
 * GET    /api/referrals           - Get patient/doctor referrals
 * GET    /api/referrals/[id]      - Get specific referral
 * PATCH  /api/referrals/[id]      - Update referral status
 */

import { NextRequest, NextResponse } from 'next/server';
import { ReferralService } from '@/lib/services/referralService';
import { rateLimit } from '@/lib/middleware/rateLimiter';
import { securityHeaders } from '@/lib/middleware/securityHeaders';

/**
 * POST /api/referrals
 * Create new referral
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
    const userId = 'user_123'; // TODO: Get from session
    const ipAddress = req.headers.get('x-forwarded-for');

    const result = await ReferralService.createReferral(body, userId, ipAddress);

    return NextResponse.json(result.body, {
      status: result.status,
      headers: securityHeaders(),
    });
  } catch (error) {
    console.error('Error in POST /api/referrals:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}

/**
 * GET /api/referrals
 * Get referrals (for doctor or patient)
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

    const doctorId = req.nextUrl.searchParams.get('doctorId');
    const patientId = req.nextUrl.searchParams.get('patientId');
    const status = req.nextUrl.searchParams.get('status');
    const userId = 'user_123'; // TODO: Get from session

    if (doctorId) {
      const result = await ReferralService.getDoctorReferrals(
        doctorId,
        userId,
        { status: status || undefined }
      );
      return NextResponse.json(result.body, {
        status: result.status,
        headers: securityHeaders(),
      });
    }

    if (patientId) {
      const result = await ReferralService.getPatientReferrals(patientId, userId);
      return NextResponse.json(result.body, {
        status: result.status,
        headers: securityHeaders(),
      });
    }

    return NextResponse.json(
      { success: false, error: 'doctorId or patientId is required' },
      { status: 400, headers: securityHeaders() }
    );
  } catch (error) {
    console.error('Error in GET /api/referrals:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}
