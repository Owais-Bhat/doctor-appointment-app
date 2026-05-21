/**
 * Payments API
 *
 * POST /api/payments - Create payment intent
 * GET /api/payments - Get transactions
 */

import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/lib/payments/paymentService';
import { checkRateLimitByUser } from '@/lib/middleware/rateLimiter';
import { setSecurityHeaders } from '@/lib/middleware/securityHeaders';
import { successResponse, errorResponse, ApiErrors } from '@/lib/api/response';

/**
 * Get transactions
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('user-id');
    const patientId = request.nextUrl.searchParams.get('patientId');
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';

    if (!userId || !patientId) {
      return NextResponse.json(
        errorResponse(ApiErrors.validationError),
        { status: 400 }
      );
    }

    const transactions = await paymentService.getPatientTransactions(
      patientId,
      userId,
      ipAddress
    );

    const response = new NextResponse(
      JSON.stringify(
        successResponse({
          transactions,
          count: transactions.length,
        })
      )
    );

    setSecurityHeaders(response.headers, 'production');
    return response;
  } catch (error: any) {
    console.error('Error fetching transactions:', error);

    return NextResponse.json(
      errorResponse({
        code: 'PAYMENT_ERROR',
        message: 'Failed to retrieve transactions',
      }),
      { status: 500 }
    );
  }
}

/**
 * Create payment intent
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('user-id');
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const data = await request.json();

    if (!userId || !data.patientId || !data.appointmentId || !data.amount) {
      return NextResponse.json(
        errorResponse(ApiErrors.validationError),
        { status: 400 }
      );
    }

    // Check rate limit
    const rateLimitResult = await checkRateLimitByUser(userId, 5, 60000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        errorResponse(ApiErrors.rateLimitExceeded),
        { status: 429 }
      );
    }

    // Create payment intent
    const { clientSecret, transactionId } = await paymentService.createPaymentIntent(
      data.patientId,
      data.appointmentId,
      data.amount,
      data.description || 'Appointment consultation',
      userId,
      ipAddress
    );

    const response = new NextResponse(
      JSON.stringify(
        successResponse(
          { clientSecret, transactionId },
          {
            statusCode: 201,
            message: 'Payment intent created',
          }
        )
      ),
      { status: 201 }
    );

    setSecurityHeaders(response.headers, 'production');
    return response;
  } catch (error: any) {
    console.error('Error creating payment intent:', error);

    return NextResponse.json(
      errorResponse({
        code: 'PAYMENT_ERROR',
        message: 'Failed to create payment intent',
      }),
      { status: 500 }
    );
  }
}
