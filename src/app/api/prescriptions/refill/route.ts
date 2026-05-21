/**
 * Prescription Refill API
 *
 * POST /api/prescriptions/refill - Request refill
 * POST /api/prescriptions/refill/approve - Approve refill (doctor)
 * POST /api/prescriptions/refill/deny - Deny refill (doctor)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prescriptionService } from '@/lib/prescriptions/prescriptionService';
import { setSecurityHeaders } from '@/lib/middleware/securityHeaders';
import { successResponse, errorResponse, ApiErrors } from '@/lib/api/response';

/**
 * Request prescription refill
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('user-id');
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const data = await request.json();

    if (!userId || !data.prescriptionId) {
      return NextResponse.json(
        errorResponse(ApiErrors.validationError),
        { status: 400 }
      );
    }

    // Request refill
    const refillRequest = await prescriptionService.requestRefill(
      data.prescriptionId,
      userId,
      ipAddress
    );

    const response = new NextResponse(
      JSON.stringify(
        successResponse(refillRequest, {
          statusCode: 201,
          message: 'Refill request submitted',
        })
      ),
      { status: 201 }
    );

    setSecurityHeaders(response.headers, 'production');
    return response;
  } catch (error: any) {
    console.error('Error requesting refill:', error);

    const statusCode = error.message.includes('No refills') ? 400 : 500;

    return NextResponse.json(
      errorResponse({
        code: 'REFILL_ERROR',
        message: error.message || 'Failed to request refill',
      }),
      { status: statusCode }
    );
  }
}

/**
 * Approve refill request
 */
export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get('user-id');
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const data = await request.json();

    if (!userId || !data.refillId) {
      return NextResponse.json(
        errorResponse(ApiErrors.validationError),
        { status: 400 }
      );
    }

    // Determine action
    const action = request.nextUrl.searchParams.get('action') || 'approve';

    if (action === 'approve') {
      const refillRequest = await prescriptionService.approveRefill(
        data.refillId,
        data.doctorId || userId,
        userId,
        ipAddress
      );

      const response = new NextResponse(
        JSON.stringify(successResponse(refillRequest, { message: 'Refill approved' }))
      );

      setSecurityHeaders(response.headers, 'production');
      return response;
    } else if (action === 'deny') {
      const refillRequest = await prescriptionService.denyRefill(
        data.refillId,
        data.reason || 'Denied by doctor',
        data.doctorId || userId,
        userId,
        ipAddress
      );

      const response = new NextResponse(
        JSON.stringify(successResponse(refillRequest, { message: 'Refill denied' }))
      );

      setSecurityHeaders(response.headers, 'production');
      return response;
    } else {
      return NextResponse.json(
        errorResponse(ApiErrors.validationError),
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error processing refill:', error);

    return NextResponse.json(
      errorResponse({
        code: 'REFILL_ERROR',
        message: error.message || 'Failed to process refill',
      }),
      { status: 500 }
    );
  }
}
