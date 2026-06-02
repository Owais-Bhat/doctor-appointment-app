/**
 * EHR Integration API Routes
 *
 * POST /api/integrations/ehr
 * - action: configure - Setup EHR connection
 * - action: sync-patient - Sync patient from EHR
 * - action: sync-records - Sync medical records
 * - action: send-hl7 - Send HL7 message
 * - action: receive-hl7 - Receive HL7 message
 *
 * GET /api/integrations/ehr
 * - action: patients - List synced patients
 * - action: sync-history - Recent syncs
 * - action: hl7-history - HL7 message history
 * - action: status - Integration status
 */

import { NextRequest, NextResponse } from 'next/server';
import { EHRIntegrationService } from '@/lib/integrations/ehrIntegration';
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
    const { action, organizationId, ehrConfigId, ehrVendor, apiEndpoint, clientId, clientSecret, authenticationType, dataSyncFrequency, ehrPatientId, patientData, patientId, recordType, sourceEHR, recordCount, success, errorMessage, messageType, content } = body;

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Missing organizationId' },
        { status: 400, headers: securityHeaders() }
      );
    }

    if (action === 'configure') {
      if (!ehrVendor || !apiEndpoint || !clientId || !clientSecret || !authenticationType) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const config = await EHRIntegrationService.configureEHR(
        organizationId,
        ehrVendor,
        apiEndpoint,
        clientId,
        clientSecret,
        authenticationType,
        dataSyncFrequency || 'hourly'
      );

      return NextResponse.json(
        { success: true, data: config },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'sync-patient') {
      if (!ehrConfigId || !ehrPatientId || !patientData) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const record = await EHRIntegrationService.syncPatientFromEHR(
        ehrConfigId,
        ehrPatientId,
        patientData
      );

      return NextResponse.json(
        { success: true, data: record },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'sync-records') {
      if (!ehrConfigId || !patientId || !recordType || recordCount === undefined || success === undefined) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const sync = await EHRIntegrationService.recordMedicalRecordSync(
        organizationId,
        ehrConfigId,
        patientId,
        recordType,
        sourceEHR || false,
        recordCount,
        success,
        errorMessage
      );

      return NextResponse.json(
        { success: true, data: sync },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'send-hl7') {
      if (!ehrConfigId || !messageType || !content) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const message = await EHRIntegrationService.sendHL7Message(
        organizationId,
        ehrConfigId,
        messageType,
        content
      );

      return NextResponse.json(
        { success: true, data: message },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'receive-hl7') {
      if (!ehrConfigId || !messageType || !content) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const message = await EHRIntegrationService.receiveHL7Message(
        organizationId,
        ehrConfigId,
        messageType,
        content
      );

      return NextResponse.json(
        { success: true, data: message },
        { status: 200, headers: securityHeaders() }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400, headers: securityHeaders() }
      );
    }
  } catch (error) {
    console.error('Error in POST /api/integrations/ehr:', error);
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
    const ehrConfigId = req.nextUrl.searchParams.get('ehrConfigId');
    const days = parseInt(req.nextUrl.searchParams.get('days') || '7');

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Missing organizationId' },
        { status: 400, headers: securityHeaders() }
      );
    }

    if (action === 'patients') {
      const patients = await EHRIntegrationService.getPatientRecords(organizationId);
      return NextResponse.json(
        { success: true, data: patients },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'sync-history') {
      const history = await EHRIntegrationService.getSyncHistory(organizationId, days);
      return NextResponse.json(
        { success: true, data: history },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'hl7-history') {
      const history = await EHRIntegrationService.getHL7MessageHistory(organizationId, days);
      return NextResponse.json(
        { success: true, data: history },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'status') {
      if (!ehrConfigId) {
        return NextResponse.json(
          { success: false, error: 'Missing ehrConfigId' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const status = await EHRIntegrationService.getIntegrationStatus(ehrConfigId);
      return NextResponse.json(
        { success: true, data: status },
        { status: 200, headers: securityHeaders() }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400, headers: securityHeaders() }
      );
    }
  } catch (error) {
    console.error('Error in GET /api/integrations/ehr:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}
