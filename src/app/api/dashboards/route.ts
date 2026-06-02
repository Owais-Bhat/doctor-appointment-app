/**
 * Dashboard API Routes
 *
 * GET /api/dashboards/executive   - Executive dashboard
 * GET /api/dashboards/clinic      - Clinic dashboard
 * GET /api/dashboards/doctor      - Doctor dashboard
 * GET /api/dashboards/financial   - Financial dashboard
 * GET /api/dashboards/quality     - Quality dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { DashboardService } from '@/lib/services/dashboardService';
import { rateLimit } from '@/lib/middleware/rateLimiter';
import { securityHeaders } from '@/lib/middleware/securityHeaders';

/**
 * GET /api/dashboards
 * Get dashboard based on type
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

    const type = req.nextUrl.searchParams.get('type');
    const organizationId = req.nextUrl.searchParams.get('organizationId');
    const clinicId = req.nextUrl.searchParams.get('clinicId');
    const doctorId = req.nextUrl.searchParams.get('doctorId');
    const userId = 'user_123'; // TODO: Get from session

    switch (type) {
      case 'executive':
        if (!organizationId) {
          return NextResponse.json(
            { success: false, error: 'organizationId is required' },
            { status: 400, headers: securityHeaders() }
          );
        }
        return handleExecutiveDashboard(organizationId, userId);

      case 'clinic':
        if (!clinicId) {
          return NextResponse.json(
            { success: false, error: 'clinicId is required' },
            { status: 400, headers: securityHeaders() }
          );
        }
        return handleClinicDashboard(clinicId, userId);

      case 'doctor':
        if (!doctorId) {
          return NextResponse.json(
            { success: false, error: 'doctorId is required' },
            { status: 400, headers: securityHeaders() }
          );
        }
        return handleDoctorDashboard(doctorId, userId);

      case 'financial':
        if (!organizationId) {
          return NextResponse.json(
            { success: false, error: 'organizationId is required' },
            { status: 400, headers: securityHeaders() }
          );
        }
        return handleFinancialDashboard(organizationId, userId);

      case 'quality':
        if (!organizationId) {
          return NextResponse.json(
            { success: false, error: 'organizationId is required' },
            { status: 400, headers: securityHeaders() }
          );
        }
        return handleQualityDashboard(organizationId, userId);

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid dashboard type' },
          { status: 400, headers: securityHeaders() }
        );
    }
  } catch (error) {
    console.error('Error in GET /api/dashboards:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}

async function handleExecutiveDashboard(organizationId: string, userId: string) {
  const result = await DashboardService.getExecutiveDashboard(organizationId, userId);
  return NextResponse.json(result.body, {
    status: result.status,
    headers: securityHeaders(),
  });
}

async function handleClinicDashboard(clinicId: string, userId: string) {
  const result = await DashboardService.getClinicDashboard(clinicId, userId);
  return NextResponse.json(result.body, {
    status: result.status,
    headers: securityHeaders(),
  });
}

async function handleDoctorDashboard(doctorId: string, userId: string) {
  const result = await DashboardService.getDoctorDashboard(doctorId, userId);
  return NextResponse.json(result.body, {
    status: result.status,
    headers: securityHeaders(),
  });
}

async function handleFinancialDashboard(organizationId: string, userId: string) {
  const result = await DashboardService.getFinancialDashboard(organizationId, userId);
  return NextResponse.json(result.body, {
    status: result.status,
    headers: securityHeaders(),
  });
}

async function handleQualityDashboard(organizationId: string, userId: string) {
  const result = await DashboardService.getQualityDashboard(organizationId, userId);
  return NextResponse.json(result.body, {
    status: result.status,
    headers: securityHeaders(),
  });
}
