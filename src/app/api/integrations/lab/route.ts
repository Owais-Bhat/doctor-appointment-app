/**
 * Lab Integration API Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { LabIntegrationService } from '@/lib/integrations/labIntegration';
import { rateLimit } from '@/lib/middleware/rateLimiter';
import { securityHeaders } from '@/lib/middleware/securityHeaders';

export async function POST(req: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(req, 'enterprise');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429, headers: securityHeaders() }
      );
    }

    const body = await req.json();
    const { action, organizationId, labProvider, apiEndpoint, apiKey, facilityCode, patientId, orderedByPhysician, testCodes, testNames, collectionLocation, priority, specialInstructions, labOrderId, testName, testCode, value, unit, referenceRange, labName, status, collectionDate } = body;

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Missing organizationId' },
        { status: 400, headers: securityHeaders() }
      );
    }

    if (action === 'configure') {
      const config = await LabIntegrationService.configureLab(
        organizationId,
        labProvider,
        apiEndpoint,
        apiKey,
        facilityCode
      );
      return NextResponse.json({ success: true, data: config }, { status: 200, headers: securityHeaders() });
    } else if (action === 'create-order') {
      const order = await LabIntegrationService.createLabOrder(
        organizationId,
        patientId,
        orderedByPhysician,
        testCodes,
        testNames,
        collectionLocation,
        priority || 'routine',
        specialInstructions
      );
      return NextResponse.json({ success: true, data: order }, { status: 200, headers: securityHeaders() });
    } else if (action === 'record-result') {
      const result = await LabIntegrationService.recordLabResult(
        organizationId,
        labOrderId,
        patientId,
        testName,
        testCode,
        value,
        unit,
        referenceRange,
        labName
      );
      return NextResponse.json({ success: true, data: result }, { status: 200, headers: securityHeaders() });
    } else if (action === 'update-order') {
      const updated = await LabIntegrationService.updateOrderStatus(
        organizationId,
        labOrderId,
        status,
        collectionDate ? new Date(collectionDate) : undefined
      );
      return NextResponse.json(
        { success: !!updated, data: updated },
        { status: updated ? 200 : 404, headers: securityHeaders() }
      );
    } else {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400, headers: securityHeaders() });
    }
  } catch (error) {
    console.error('Error in POST /api/integrations/lab:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(req, 'enterprise');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429, headers: securityHeaders() }
      );
    }

    const action = req.nextUrl.searchParams.get('action');
    const organizationId = req.nextUrl.searchParams.get('organizationId');
    const patientId = req.nextUrl.searchParams.get('patientId');
    const labOrderId = req.nextUrl.searchParams.get('labOrderId');

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Missing organizationId' },
        { status: 400, headers: securityHeaders() }
      );
    }

    if (action === 'orders') {
      const orders = await LabIntegrationService.getLabOrders(organizationId, patientId);
      return NextResponse.json({ success: true, data: orders }, { status: 200, headers: securityHeaders() });
    } else if (action === 'results') {
      if (!patientId) {
        return NextResponse.json(
          { success: false, error: 'Missing patientId' },
          { status: 400, headers: securityHeaders() }
        );
      }
      const results = await LabIntegrationService.getLabResults(organizationId, patientId);
      return NextResponse.json({ success: true, data: results }, { status: 200, headers: securityHeaders() });
    } else if (action === 'order-results') {
      if (!labOrderId) {
        return NextResponse.json(
          { success: false, error: 'Missing labOrderId' },
          { status: 400, headers: securityHeaders() }
        );
      }
      const results = await LabIntegrationService.getLabResultsByOrder(organizationId, labOrderId);
      return NextResponse.json({ success: true, data: results }, { status: 200, headers: securityHeaders() });
    } else if (action === 'metrics') {
      const metrics = await LabIntegrationService.getLabMetrics(organizationId);
      return NextResponse.json({ success: true, data: metrics }, { status: 200, headers: securityHeaders() });
    } else {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400, headers: securityHeaders() });
    }
  } catch (error) {
    console.error('Error in GET /api/integrations/lab:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}
