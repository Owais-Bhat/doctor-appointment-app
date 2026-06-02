/**
 * Pharmacy Integration API Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { PharmacyIntegrationService } from '@/lib/integrations/pharmacyIntegration';
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
    const { action, organizationId, pharmacyProvider, apiEndpoint, ncpdpId, storefrontId, patientId, medicationName, ndc, dosage, quantity, refills, daysSupply, prescribedBy, prescriptionId, requestedPharmacyId, refillId, refillStatus, rejectionReason, filledDate, currentMedications, pharmacyId, pharmacyName, address, city, state, zipCode, phoneNumber, deliveryAvailable } = body;

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Missing organizationId' },
        { status: 400, headers: securityHeaders() }
      );
    }

    if (action === 'configure') {
      const config = await PharmacyIntegrationService.configurePharmacy(
        organizationId,
        pharmacyProvider,
        apiEndpoint,
        ncpdpId,
        storefrontId
      );
      return NextResponse.json({ success: true, data: config }, { status: 200, headers: securityHeaders() });
    } else if (action === 'create-prescription') {
      const prescription = await PharmacyIntegrationService.createPrescription(
        organizationId,
        patientId,
        medicationName,
        ndc,
        dosage,
        quantity,
        refills,
        daysSupply,
        prescribedBy
      );
      return NextResponse.json({ success: true, data: prescription }, { status: 200, headers: securityHeaders() });
    } else if (action === 'request-refill') {
      const refill = await PharmacyIntegrationService.requestRefill(
        organizationId,
        patientId,
        prescriptionId,
        requestedPharmacyId
      );
      return NextResponse.json({ success: true, data: refill }, { status: 200, headers: securityHeaders() });
    } else if (action === 'update-refill') {
      const updated = await PharmacyIntegrationService.updateRefillStatus(
        organizationId,
        refillId,
        refillStatus,
        rejectionReason,
        filledDate ? new Date(filledDate) : undefined
      );
      return NextResponse.json(
        { success: !!updated, data: updated },
        { status: updated ? 200 : 404, headers: securityHeaders() }
      );
    } else if (action === 'check-interactions') {
      const check = await PharmacyIntegrationService.checkDrugInteractions(
        organizationId,
        patientId,
        prescriptionId,
        currentMedications
      );
      return NextResponse.json({ success: true, data: check }, { status: 200, headers: securityHeaders() });
    } else if (action === 'add-pharmacy') {
      const pharmacy = await PharmacyIntegrationService.addPharmacyToNetwork(
        organizationId,
        pharmacyId,
        pharmacyName,
        address,
        city,
        state,
        zipCode,
        phoneNumber,
        deliveryAvailable
      );
      return NextResponse.json({ success: true, data: pharmacy }, { status: 200, headers: securityHeaders() });
    } else {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400, headers: securityHeaders() });
    }
  } catch (error) {
    console.error('Error in POST /api/integrations/pharmacy:', error);
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
    const refillStatus = req.nextUrl.searchParams.get('status');

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Missing organizationId' },
        { status: 400, headers: securityHeaders() }
      );
    }

    if (action === 'prescriptions') {
      if (!patientId) {
        return NextResponse.json(
          { success: false, error: 'Missing patientId' },
          { status: 400, headers: securityHeaders() }
        );
      }
      const prescriptions = await PharmacyIntegrationService.getPrescriptions(organizationId, patientId);
      return NextResponse.json({ success: true, data: prescriptions }, { status: 200, headers: securityHeaders() });
    } else if (action === 'refills') {
      const refills = await PharmacyIntegrationService.getRefillRequests(organizationId, patientId, refillStatus);
      return NextResponse.json({ success: true, data: refills }, { status: 200, headers: securityHeaders() });
    } else if (action === 'network') {
      const network = await PharmacyIntegrationService.getPharmacyNetwork(organizationId);
      return NextResponse.json({ success: true, data: network }, { status: 200, headers: securityHeaders() });
    } else if (action === 'metrics') {
      const metrics = await PharmacyIntegrationService.getPharmacyMetrics(organizationId);
      return NextResponse.json({ success: true, data: metrics }, { status: 200, headers: securityHeaders() });
    } else {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400, headers: securityHeaders() });
    }
  } catch (error) {
    console.error('Error in GET /api/integrations/pharmacy:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}
