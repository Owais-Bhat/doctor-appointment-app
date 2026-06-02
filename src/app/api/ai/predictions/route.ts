/**
 * AI Predictions API Routes
 *
 * POST /api/ai/predictions
 * - action: predict-churn - Predict patient churn risk
 * - action: predict-readmission - Predict readmission risk
 * - action: predict-dna - Predict no-show (DNA) risk
 * - action: predict-revenue - Predict revenue impact
 * - action: predict-utilization - Predict clinic utilization
 *
 * GET /api/ai/predictions
 * - action: user-predictions - Get user's predictions
 * - action: prediction - Get specific prediction
 */

import { NextRequest, NextResponse } from 'next/server';
import { PredictiveAnalyticsService } from '@/lib/services/predictiveAnalyticsService';
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

    if (action === 'predict-churn') {
      const { userId, patientId, lastVisitDays, appointmentNo, avgDaysBetweenVisits } = body;

      if (!userId || !patientId || typeof lastVisitDays !== 'number') {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const prediction = await PredictiveAnalyticsService.predictChurnRisk(
        userId,
        patientId,
        lastVisitDays,
        appointmentNo || 0,
        avgDaysBetweenVisits || 90
      );

      return NextResponse.json(
        { success: true, data: prediction },
        { status: 201, headers: securityHeaders() }
      );
    } else if (action === 'predict-readmission') {
      const { userId, patientId, conditions, recentHospitalization, medicationCount } = body;

      if (!userId || !patientId || !Array.isArray(conditions)) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const prediction = await PredictiveAnalyticsService.predictReadmissionRisk(
        userId,
        patientId,
        conditions,
        recentHospitalization || false,
        medicationCount || 0
      );

      return NextResponse.json(
        { success: true, data: prediction },
        { status: 201, headers: securityHeaders() }
      );
    } else if (action === 'predict-dna') {
      const { userId, patientId, noShowCount, cancelCount, appointmentType } = body;

      if (!userId || !patientId) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const prediction = await PredictiveAnalyticsService.predictDNARisk(
        userId,
        patientId,
        noShowCount || 0,
        cancelCount || 0,
        appointmentType || 'consultation'
      );

      return NextResponse.json(
        { success: true, data: prediction },
        { status: 201, headers: securityHeaders() }
      );
    } else if (action === 'predict-revenue') {
      const { userId, doctorId, appointmentRate, avgRevenuePerAppointment, seasonalityFactor } =
        body;

      if (!userId || !doctorId || typeof appointmentRate !== 'number') {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const prediction = await PredictiveAnalyticsService.predictRevenueImpact(
        userId,
        doctorId,
        appointmentRate,
        avgRevenuePerAppointment || 150,
        seasonalityFactor || 1
      );

      return NextResponse.json(
        { success: true, data: prediction },
        { status: 201, headers: securityHeaders() }
      );
    } else if (action === 'predict-utilization') {
      const { userId, clinicId, slotsAvailable, slotsBooked, historicalUtilizationRate } = body;

      if (!userId || !clinicId || typeof slotsAvailable !== 'number') {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const prediction = await PredictiveAnalyticsService.predictUtilization(
        userId,
        clinicId,
        slotsAvailable,
        slotsBooked || 0,
        historicalUtilizationRate || 0.65
      );

      return NextResponse.json(
        { success: true, data: prediction },
        { status: 201, headers: securityHeaders() }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400, headers: securityHeaders() }
      );
    }
  } catch (error) {
    console.error('Error in POST /api/ai/predictions:', error);
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
    const userId = req.nextUrl.searchParams.get('userId');
    const predictionId = req.nextUrl.searchParams.get('predictionId');
    const type = req.nextUrl.searchParams.get('type');

    if (action === 'user-predictions') {
      if (!userId) {
        return NextResponse.json(
          { success: false, error: 'Missing user ID' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const predictions = await PredictiveAnalyticsService.getUserPredictions(userId, type || undefined);

      return NextResponse.json(
        { success: true, data: { predictions } },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'prediction') {
      if (!predictionId) {
        return NextResponse.json(
          { success: false, error: 'Missing prediction ID' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const prediction = await PredictiveAnalyticsService.getPredictionById(predictionId);

      if (!prediction) {
        return NextResponse.json(
          { success: false, error: 'Prediction not found' },
          { status: 404, headers: securityHeaders() }
        );
      }

      return NextResponse.json(
        { success: true, data: prediction },
        { status: 200, headers: securityHeaders() }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400, headers: securityHeaders() }
      );
    }
  } catch (error) {
    console.error('Error in GET /api/ai/predictions:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}
