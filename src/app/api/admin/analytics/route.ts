/**
 * Admin Analytics API
 *
 * GET /api/admin/analytics - Get dashboard metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyticsService } from '@/lib/analytics/analyticsService';
import { setSecurityHeaders } from '@/lib/middleware/securityHeaders';
import { successResponse, errorResponse, ApiErrors } from '@/lib/api/response';

/**
 * Get analytics metrics
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('user-id');
    const role = request.headers.get('user-role');
    const metric = request.nextUrl.searchParams.get('metric');
    const period = (request.nextUrl.searchParams.get('period') as any) || 'month';

    // Check admin access
    if (role !== 'admin') {
      return NextResponse.json(
        errorResponse(ApiErrors.unauthorized),
        { status: 401 }
      );
    }

    let data;

    switch (metric) {
      case 'appointments':
        data = analyticsService.getAppointmentMetrics(period);
        break;

      case 'revenue':
        data = analyticsService.getRevenueMetrics(period);
        break;

      case 'doctors':
        const doctorId = request.nextUrl.searchParams.get('doctorId');
        if (doctorId) {
          data = analyticsService.getDoctorMetrics(doctorId);
        } else {
          data = analyticsService.getAllDoctorMetrics();
        }
        break;

      case 'patients':
        data = analyticsService.getPatientMetrics();
        break;

      case 'health':
        data = analyticsService.getSystemHealthMetrics();
        break;

      case 'insights':
        data = analyticsService.getTopInsights();
        break;

      case 'trends':
        data = analyticsService.getTrendingMetrics();
        break;

      case 'dashboard':
        data = {
          appointments: analyticsService.getAppointmentMetrics(period),
          revenue: analyticsService.getRevenueMetrics(period),
          patients: analyticsService.getPatientMetrics(),
          health: analyticsService.getSystemHealthMetrics(),
          insights: analyticsService.getTopInsights(),
          trends: analyticsService.getTrendingMetrics(),
        };
        break;

      default:
        return NextResponse.json(
          errorResponse(ApiErrors.validationError),
          { status: 400 }
        );
    }

    const response = new NextResponse(
      JSON.stringify(successResponse(data))
    );

    setSecurityHeaders(response.headers, 'production');
    return response;
  } catch (error: any) {
    console.error('Error getting analytics:', error);

    return NextResponse.json(
      errorResponse({
        code: 'ANALYTICS_ERROR',
        message: 'Failed to retrieve analytics',
      }),
      { status: 500 }
    );
  }
}
