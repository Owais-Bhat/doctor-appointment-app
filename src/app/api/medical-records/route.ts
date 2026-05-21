/**
 * Medical Records API
 *
 * GET /api/medical-records - List patient records
 * POST /api/medical-records - Upload new record
 */

import { NextRequest, NextResponse } from 'next/server';
import { medicalRecordService, RecordType } from '@/lib/medical-records/recordService';
import { checkRateLimitByUser } from '@/lib/middleware/rateLimiter';
import { setSecurityHeaders } from '@/lib/middleware/securityHeaders';
import { successResponse, errorResponse, ApiErrors } from '@/lib/api/response';

/**
 * List medical records
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('user-id');
    const patientId = request.nextUrl.searchParams.get('patientId');
    const recordType = request.nextUrl.searchParams.get('recordType');
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';

    if (!userId || !patientId) {
      return NextResponse.json(
        errorResponse(ApiErrors.validationError),
        { status: 400 }
      );
    }

    // Get records
    const records = await medicalRecordService.getPatientRecords(
      patientId,
      userId,
      ipAddress,
      recordType ? { recordType: recordType as RecordType } : undefined
    );

    const response = new NextResponse(
      JSON.stringify(successResponse({ records, count: records.length }))
    );

    setSecurityHeaders(response.headers, 'production');
    return response;
  } catch (error: any) {
    console.error('Error fetching records:', error);

    return NextResponse.json(
      errorResponse({
        code: 'RECORDS_ERROR',
        message: error.message || 'Failed to retrieve records',
      }),
      { status: 500 }
    );
  }
}

/**
 * Upload medical record
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('user-id');
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';

    // Check rate limit
    const rateLimitResult = await checkRateLimitByUser(userId || '', 5, 60000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        errorResponse(ApiErrors.rateLimitExceeded),
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const patientId = formData.get('patientId') as string;
    const recordType = formData.get('recordType') as RecordType;
    const description = formData.get('description') as string | null;

    if (!userId || !file || !patientId || !recordType) {
      return NextResponse.json(
        errorResponse(ApiErrors.validationError),
        { status: 400 }
      );
    }

    // TODO: Upload file to cloud storage
    const fileUrl = `${process.env.NEXT_PUBLIC_APP_URL}/uploads/${file.name}`;

    // Upload record
    const record = await medicalRecordService.uploadRecord(
      patientId,
      recordType,
      file,
      fileUrl,
      userId,
      ipAddress,
      description || undefined
    );

    const response = new NextResponse(
      JSON.stringify(
        successResponse(record, {
          statusCode: 201,
          message: 'Record uploaded successfully',
        })
      ),
      { status: 201 }
    );

    setSecurityHeaders(response.headers, 'production');
    return response;
  } catch (error: any) {
    console.error('Error uploading record:', error);

    return NextResponse.json(
      errorResponse({
        code: 'UPLOAD_ERROR',
        message: error.message || 'Failed to upload record',
      }),
      { status: 500 }
    );
  }
}
