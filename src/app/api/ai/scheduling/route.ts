/**
 * Intelligent Scheduling API Routes
 *
 * POST /api/ai/scheduling
 * - action: optimal-times - Get optimal scheduling times
 * - action: predict-conflicts - Predict scheduling conflicts
 * - action: balance-workload - Balance doctor workload
 * - action: suggest-reschedule - Suggest rescheduling alternatives
 *
 * GET /api/ai/scheduling
 * - action: available-slots - Get available time slots
 * - action: optimize-gaps - Get gap optimization suggestions
 */

import { NextRequest, NextResponse } from 'next/server';
import { IntelligentSchedulingService } from '@/lib/services/intelligentSchedulingService';
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

    if (action === 'optimal-times') {
      const { patientId, doctorId, appointmentType, availableSlots } = body;

      if (!patientId || !doctorId || !appointmentType || !Array.isArray(availableSlots)) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const recommendation = await IntelligentSchedulingService.getOptimalSchedulingTimes(
        patientId,
        doctorId,
        appointmentType,
        availableSlots.map((s) => new Date(s))
      );

      return NextResponse.json(
        { success: true, data: recommendation },
        { status: 201, headers: securityHeaders() }
      );
    } else if (action === 'predict-conflicts') {
      const { doctorId, startTime, duration } = body;

      if (!doctorId || !startTime || typeof duration !== 'number') {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const result = await IntelligentSchedulingService.predictConflicts(
        doctorId,
        new Date(startTime),
        duration
      );

      return NextResponse.json(
        { success: true, data: result },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'balance-workload') {
      const { doctorId, clinicId, newAppointmentDuration } = body;

      if (!doctorId || !clinicId || typeof newAppointmentDuration !== 'number') {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const result = await IntelligentSchedulingService.balanceWorkload(
        doctorId,
        clinicId,
        newAppointmentDuration
      );

      return NextResponse.json(
        { success: true, data: result },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'suggest-reschedule') {
      const { appointmentId, reason } = body;

      if (!appointmentId || !reason) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const result = await IntelligentSchedulingService.suggestRescheduling(appointmentId, reason);

      return NextResponse.json(
        { success: true, data: result },
        { status: 200, headers: securityHeaders() }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400, headers: securityHeaders() }
      );
    }
  } catch (error) {
    console.error('Error in POST /api/ai/scheduling:', error);
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

    const action = req.nextUrl.searchParams.get('action');
    const doctorId = req.nextUrl.searchParams.get('doctorId');
    const date = req.nextUrl.searchParams.get('date');
    const slotDuration = req.nextUrl.searchParams.get('slotDuration');

    if (action === 'available-slots') {
      if (!doctorId || !date) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const slots = await IntelligentSchedulingService.findAvailableSlots(
        doctorId,
        new Date(date),
        slotDuration ? parseInt(slotDuration) : 30
      );

      return NextResponse.json(
        { success: true, data: { slots } },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'optimize-gaps') {
      if (!doctorId) {
        return NextResponse.json(
          { success: false, error: 'Missing doctor ID' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const suggestions = await IntelligentSchedulingService.optimizeScheduleGaps(doctorId);

      return NextResponse.json(
        { success: true, data: { suggestions } },
        { status: 200, headers: securityHeaders() }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400, headers: securityHeaders() }
      );
    }
  } catch (error) {
    console.error('Error in GET /api/ai/scheduling:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}
