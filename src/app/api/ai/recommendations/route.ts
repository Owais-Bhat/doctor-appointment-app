/**
 * AI Recommendations API Routes
 *
 * POST /api/ai/recommendations
 * - action: generate-appointment - Generate appointment recommendations
 * - action: generate-treatment - Generate treatment recommendations
 * - action: generate-referral - Generate referral recommendations
 * - action: dismiss - Dismiss a recommendation
 *
 * GET /api/ai/recommendations
 * - action: user-recommendations - Get user's recommendations
 * - action: recommendation-score - Get recommendation confidence score
 */

import { NextRequest, NextResponse } from 'next/server';
import { AIRecommendationService } from '@/lib/services/aiRecommendationService';
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

    if (action === 'generate-appointment') {
      const { userId, specialty, lastVisit, confidence } = body;

      if (!userId || !specialty || !lastVisit) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const recommendation = await AIRecommendationService.generateAppointmentRecommendation(
        userId,
        specialty,
        new Date(lastVisit),
        confidence || 0.85
      );

      return NextResponse.json(
        { success: true, data: recommendation },
        { status: 201, headers: securityHeaders() }
      );
    } else if (action === 'generate-treatment') {
      const { userId, condition, treatmentType, confidence } = body;

      if (!userId || !condition || !treatmentType) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const recommendation = await AIRecommendationService.generateTreatmentRecommendation(
        userId,
        condition,
        treatmentType,
        confidence || 0.75
      );

      return NextResponse.json(
        { success: true, data: recommendation },
        { status: 201, headers: securityHeaders() }
      );
    } else if (action === 'generate-referral') {
      const { userId, specialty, reason, confidence } = body;

      if (!userId || !specialty || !reason) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const recommendation = await AIRecommendationService.generateReferralRecommendation(
        userId,
        specialty,
        reason,
        confidence || 0.8
      );

      return NextResponse.json(
        { success: true, data: recommendation },
        { status: 201, headers: securityHeaders() }
      );
    } else if (action === 'dismiss') {
      const { recId } = body;

      if (!recId) {
        return NextResponse.json(
          { success: false, error: 'Missing recommendation ID' },
          { status: 400, headers: securityHeaders() }
        );
      }

      await AIRecommendationService.dismissRecommendation(recId);

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
    console.error('Error in POST /api/ai/recommendations:', error);
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
    const limit = req.nextUrl.searchParams.get('limit');

    if (action === 'user-recommendations') {
      if (!userId) {
        return NextResponse.json(
          { success: false, error: 'Missing user ID' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const recommendations = await AIRecommendationService.getUserRecommendations(
        userId,
        limit ? parseInt(limit) : 10
      );

      return NextResponse.json(
        { success: true, data: { recommendations } },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'recommendation-score') {
      if (!userId) {
        return NextResponse.json(
          { success: false, error: 'Missing user ID' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const score = await AIRecommendationService.getRecommendationScore(userId);

      return NextResponse.json(
        { success: true, data: { score } },
        { status: 200, headers: securityHeaders() }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400, headers: securityHeaders() }
      );
    }
  } catch (error) {
    console.error('Error in GET /api/ai/recommendations:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}
