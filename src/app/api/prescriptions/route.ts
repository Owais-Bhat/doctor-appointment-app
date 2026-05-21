/**
 * Prescriptions API
 *
 * GET /api/prescriptions - List prescriptions
 * POST /api/prescriptions - Create prescription
 */

import { NextRequest, NextResponse } from 'next/server';
import { prescriptionService, PrescriptionFrequency } from '@/lib/prescriptions/prescriptionService';
import { checkRateLimitByUser } from '@/lib/middleware/rateLimiter';
import { setSecurityHeaders } from '@/lib/middleware/securityHeaders';
import { successResponse, errorResponse, ApiErrors } from '@/lib/api/response';

/**
 * Get prescriptions
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('user-id');
    const patientId = request.nextUrl.searchParams.get('patientId');
    const activeOnly = request.nextUrl.searchParams.get('activeOnly') === 'true';
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';

    if (!userId || !patientId) {
      return NextResponse.json(
        errorResponse(ApiErrors.validationError),
        { status: 400 }
      );
    }

    let prescriptions;
    if (activeOnly) {
      prescriptions = await prescriptionService.getActivePrescriptions(
        patientId,
        userId,
        ipAddress
      );
    } else {
      prescriptions = await prescriptionService.getPatientPrescriptions(
        patientId,
        userId,
        ipAddress
      );
    }

    const stats = prescriptionService.getStats(patientId);

    const response = new NextResponse(
      JSON.stringify(
        successResponse({
          prescriptions,
          count: prescriptions.length,
          stats,
        })
      )
    );

    setSecurityHeaders(response.headers, 'production');
    return response;
  } catch (error: any) {
    console.error('Error fetching prescriptions:', error);

    return NextResponse.json(
      errorResponse({
        code: 'PRESCRIPTION_ERROR',
        message: error.message || 'Failed to retrieve prescriptions',
      }),
      { status: 500 }
    );
  }
}

/**
 * Create prescription
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('user-id');
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const data = await request.json();

    if (!userId) {
      return NextResponse.json(
        errorResponse(ApiErrors.unauthorized),
        { status: 401 }
      );
    }

    // Validate required fields
    const required = [
      'patientId',
      'doctorId',
      'medication',
      'dosage',
      'frequency',
      'duration',
      'quantity',
      'refillsMax',
    ];
    for (const field of required) {
      if (!data[field]) {
        return NextResponse.json(
          errorResponse(ApiErrors.validationError),
          { status: 400 }
        );
      }
    }

    // Check rate limit
    const rateLimitResult = await checkRateLimitByUser(userId, 10, 60000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        errorResponse(ApiErrors.rateLimitExceeded),
        { status: 429 }
      );
    }

    // Create prescription
    const prescription = await prescriptionService.createPrescription(
      data.patientId,
      data.doctorId,
      data.medication,
      data.dosage,
      data.frequency as PrescriptionFrequency,
      data.duration,
      data.quantity,
      data.refillsMax,
      userId,
      ipAddress,
      data.appointmentId,
      data.instructions,
      data.notes
    );

    const response = new NextResponse(
      JSON.stringify(
        successResponse(prescription, {
          statusCode: 201,
          message: 'Prescription created',
        })
      ),
      { status: 201 }
    );

    setSecurityHeaders(response.headers, 'production');
    return response;
  } catch (error: any) {
    console.error('Error creating prescription:', error);

    return NextResponse.json(
      errorResponse({
        code: 'PRESCRIPTION_ERROR',
        message: error.message || 'Failed to create prescription',
      }),
      { status: 500 }
    );
  }
}
