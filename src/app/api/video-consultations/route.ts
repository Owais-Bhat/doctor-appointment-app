/**
 * Video Consultations API Routes
 *
 * POST /api/video-consultations           - Schedule consultation
 * GET  /api/video-consultations           - Get consultation
 * POST /api/video-consultations/[id]/join - Join consultation
 * POST /api/video-consultations/[id]/end  - End consultation
 * GET  /api/video-consultations/stats     - Consultation statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { VideoConsultationService } from '@/lib/services/videoConsultationService';
import { rateLimit } from '@/lib/middleware/rateLimiter';
import { securityHeaders } from '@/lib/middleware/securityHeaders';

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
    const { action } = body;

    if (action === 'schedule') {
      const {
        appointmentId,
        organizationId,
        clinicId,
        doctorId,
        patientId,
        startTime,
        shouldRecord,
      } = body;

      if (!appointmentId || !organizationId || !clinicId || !doctorId || !patientId || !startTime) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const consultation = await VideoConsultationService.scheduleConsultation(
        appointmentId,
        organizationId,
        clinicId,
        doctorId,
        patientId,
        new Date(startTime),
        shouldRecord
      );

      return NextResponse.json(
        {
          success: true,
          data: {
            id: consultation.id,
            meetingLink: consultation.meetingLink,
            roomId: consultation.roomId,
            sessionToken: consultation.sessionToken,
          },
        },
        { status: 201, headers: securityHeaders() }
      );
    } else if (action === 'join') {
      const { consultationId, userId } = body;

      if (!consultationId || !userId) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      await VideoConsultationService.startConsultation(consultationId, userId);

      return NextResponse.json(
        { success: true },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'end') {
      const { consultationId, userId, notes } = body;

      if (!consultationId || !userId) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      await VideoConsultationService.endConsultation(consultationId, userId, notes);

      return NextResponse.json(
        { success: true },
        { status: 200, headers: securityHeaders() }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400, headers: securityHeaders() }
      );
    }
  } catch (error) {
    console.error('Error in POST /api/video-consultations:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(req, 'general');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429, headers: securityHeaders() }
      );
    }

    const id = req.nextUrl.searchParams.get('id');
    const appointmentId = req.nextUrl.searchParams.get('appointmentId');
    const clinicId = req.nextUrl.searchParams.get('clinicId');

    if (id) {
      const consultation = await VideoConsultationService.getConsultation(id);

      return NextResponse.json(
        { success: true, data: consultation },
        { status: 200, headers: securityHeaders() }
      );
    } else if (appointmentId) {
      const consultation = await VideoConsultationService.getConsultationByAppointment(
        appointmentId
      );

      return NextResponse.json(
        { success: true, data: consultation },
        { status: 200, headers: securityHeaders() }
      );
    } else if (clinicId) {
      const consultations = await VideoConsultationService.getActiveConsultations(clinicId);

      return NextResponse.json(
        { success: true, data: consultations },
        { status: 200, headers: securityHeaders() }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400, headers: securityHeaders() }
      );
    }
  } catch (error) {
    console.error('Error in GET /api/video-consultations:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}
