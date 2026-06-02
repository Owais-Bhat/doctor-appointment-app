/**
 * Billing Integration API Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { BillingIntegrationService } from '@/lib/integrations/billingIntegration';
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
    const { action, organizationId, billingProvider, apiKey, secretKey, webhookUrl, accountId, currency, patientId, appointmentId, amount, lineItems, dueDate, invoiceId, paymentMethod, transactionId, processingFee, insuranceProvider, claimAmount, claimId, claimStatus, approvalAmount, denialReason } = body;

    if (!organizationId) {
      return NextResponse.json({ success: false, error: 'Missing organizationId' }, { status: 400, headers: securityHeaders() });
    }

    if (action === 'configure') {
      const config = await BillingIntegrationService.configureBilling(
        organizationId,
        billingProvider,
        apiKey,
        secretKey,
        webhookUrl,
        accountId,
        currency
      );
      return NextResponse.json({ success: true, data: config }, { status: 200, headers: securityHeaders() });
    } else if (action === 'create-invoice') {
      const invoice = await BillingIntegrationService.createInvoice(
        organizationId,
        patientId,
        appointmentId,
        amount,
        currency,
        lineItems,
        dueDate ? new Date(dueDate) : new Date()
      );
      return NextResponse.json({ success: true, data: invoice }, { status: 200, headers: securityHeaders() });
    } else if (action === 'record-payment') {
      const payment = await BillingIntegrationService.recordPayment(
        organizationId,
        invoiceId,
        patientId,
        amount,
        currency,
        paymentMethod,
        transactionId,
        processingFee || 0
      );
      return NextResponse.json({ success: true, data: payment }, { status: 200, headers: securityHeaders() });
    } else if (action === 'submit-claim') {
      const claim = await BillingIntegrationService.submitInsuranceClaim(
        organizationId,
        patientId,
        appointmentId,
        insuranceProvider,
        claimAmount
      );
      return NextResponse.json({ success: true, data: claim }, { status: 200, headers: securityHeaders() });
    } else if (action === 'update-claim') {
      const updated = await BillingIntegrationService.updateClaimStatus(
        claimId,
        claimStatus,
        approvalAmount,
        denialReason
      );
      return NextResponse.json(
        { success: !!updated, data: updated },
        { status: updated ? 200 : 404, headers: securityHeaders() }
      );
    } else {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400, headers: securityHeaders() });
    }
  } catch (error) {
    console.error('Error in POST /api/integrations/billing:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500, headers: securityHeaders() });
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
    const status = req.nextUrl.searchParams.get('status');
    const days = parseInt(req.nextUrl.searchParams.get('days') || '30');
    const periodStart = req.nextUrl.searchParams.get('periodStart');
    const periodEnd = req.nextUrl.searchParams.get('periodEnd');

    if (!organizationId) {
      return NextResponse.json({ success: false, error: 'Missing organizationId' }, { status: 400, headers: securityHeaders() });
    }

    if (action === 'invoices') {
      const invoices = await BillingIntegrationService.getInvoices(organizationId, status);
      return NextResponse.json({ success: true, data: invoices }, { status: 200, headers: securityHeaders() });
    } else if (action === 'payments') {
      const payments = await BillingIntegrationService.getPayments(organizationId, days);
      return NextResponse.json({ success: true, data: payments }, { status: 200, headers: securityHeaders() });
    } else if (action === 'claims') {
      const claims = await BillingIntegrationService.getClaims(organizationId, status);
      return NextResponse.json({ success: true, data: claims }, { status: 200, headers: securityHeaders() });
    } else if (action === 'metrics') {
      const metrics = await BillingIntegrationService.getBillingMetrics(organizationId);
      return NextResponse.json({ success: true, data: metrics }, { status: 200, headers: securityHeaders() });
    } else if (action === 'reconciliation') {
      if (!periodStart || !periodEnd) {
        return NextResponse.json({ success: false, error: 'Missing dates' }, { status: 400, headers: securityHeaders() });
      }
      const report = await BillingIntegrationService.generateReconciliationReport(
        organizationId,
        new Date(periodStart),
        new Date(periodEnd)
      );
      return NextResponse.json({ success: true, data: report }, { status: 200, headers: securityHeaders() });
    } else {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400, headers: securityHeaders() });
    }
  } catch (error) {
    console.error('Error in GET /api/integrations/billing:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500, headers: securityHeaders() });
  }
}
