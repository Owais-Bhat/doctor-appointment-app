/**
 * Billing System Integration Service
 * Connect with billing platforms (Stripe, Square, PayPal, custom billing systems)
 */

import { logAudit, AuditAction } from '@/lib/audit/logger';

interface BillingConfig {
  id: string;
  organizationId: string;
  billingProvider: 'stripe' | 'square' | 'paypal' | 'authorize_net' | 'custom';
  apiKey: string;
  secretKey: string;
  webhookUrl: string;
  accountId: string;
  currency: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Invoice {
  id: string;
  organizationId: string;
  patientId: string;
  appointmentId: string;
  amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: Date;
  issuedDate: Date;
  paidDate?: Date;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

interface Payment {
  id: string;
  organizationId: string;
  invoiceId: string;
  patientId: string;
  amount: number;
  currency: string;
  paymentMethod: 'credit_card' | 'debit_card' | 'bank_transfer' | 'check' | 'cash';
  transactionId: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  timestamp: Date;
  processingFee: number;
  netAmount: number;
}

interface Claim {
  id: string;
  organizationId: string;
  patientId: string;
  appointmentId: string;
  insuranceProvider: string;
  claimAmount: number;
  submissionDate: Date;
  status: 'draft' | 'submitted' | 'acknowledged' | 'approved' | 'denied' | 'paid';
  claimNumber?: string;
  denialReason?: string;
  approvalAmount?: number;
}

interface ReconciliationReport {
  id: string;
  organizationId: string;
  periodStart: Date;
  periodEnd: Date;
  totalRevenue: number;
  totalPayments: number;
  totalRefunds: number;
  totalOutstanding: number;
  discrepancies: number;
  createdAt: Date;
}

const billingConfigs = new Map<string, BillingConfig>();
const invoices = new Map<string, Invoice[]>();
const payments = new Map<string, Payment[]>();
const claims = new Map<string, Claim[]>();
const reconciliationReports = new Map<string, ReconciliationReport[]>();

export class BillingIntegrationService {
  static async configureBilling(
    organizationId: string,
    billingProvider: 'stripe' | 'square' | 'paypal' | 'authorize_net' | 'custom',
    apiKey: string,
    secretKey: string,
    webhookUrl: string,
    accountId: string,
    currency: string = 'USD'
  ): Promise<BillingConfig> {
    const id = `billing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const config: BillingConfig = {
      id,
      organizationId,
      billingProvider,
      apiKey,
      secretKey,
      webhookUrl,
      accountId,
      currency,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    };

    billingConfigs.set(id, config);

    await logAudit(null, AuditAction.SETTINGS_UPDATED, 'BILLING_CONFIG_CREATED', id, {
      status: 'SUCCESS',
      details: { organizationId, billingProvider, currency },
    });

    return config;
  }

  static async createInvoice(
    organizationId: string,
    patientId: string,
    appointmentId: string,
    amount: number,
    currency: string,
    lineItems: Array<{ description: string; quantity: number; unitPrice: number }>,
    dueDate: Date
  ): Promise<Invoice> {
    const invoiceId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const processedItems = lineItems.map((item) => ({
      ...item,
      total: item.quantity * item.unitPrice,
    }));

    const invoice: Invoice = {
      id: invoiceId,
      organizationId,
      patientId,
      appointmentId,
      amount,
      currency,
      status: 'draft',
      dueDate,
      issuedDate: new Date(),
      lineItems: processedItems,
    };

    if (!invoices.has(organizationId)) {
      invoices.set(organizationId, []);
    }

    invoices.get(organizationId)!.push(invoice);

    await logAudit(null, AuditAction.SETTINGS_UPDATED, 'INVOICE_CREATED', invoiceId, {
      status: 'SUCCESS',
      details: { patientId, amount, currency },
    });

    return invoice;
  }

  static async recordPayment(
    organizationId: string,
    invoiceId: string,
    patientId: string,
    amount: number,
    currency: string,
    paymentMethod: 'credit_card' | 'debit_card' | 'bank_transfer' | 'check' | 'cash',
    transactionId: string,
    processingFee: number = 0
  ): Promise<Payment> {
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const payment: Payment = {
      id: paymentId,
      organizationId,
      invoiceId,
      patientId,
      amount,
      currency,
      paymentMethod,
      transactionId,
      status: 'completed',
      timestamp: new Date(),
      processingFee,
      netAmount: amount - processingFee,
    };

    if (!payments.has(organizationId)) {
      payments.set(organizationId, []);
    }

    payments.get(organizationId)!.push(payment);

    // Update invoice status
    const orginvoices = invoices.get(organizationId) || [];
    const invoice = orginvoices.find((inv) => inv.id === invoiceId);
    if (invoice) {
      invoice.status = 'paid';
      invoice.paidDate = new Date();
    }

    await logAudit(null, AuditAction.PAYMENT_PROCESSED, 'PAYMENT_RECORDED', paymentId, {
      status: 'SUCCESS',
      details: { patientId, amount, paymentMethod },
    });

    return payment;
  }

  static async submitInsuranceClaim(
    organizationId: string,
    patientId: string,
    appointmentId: string,
    insuranceProvider: string,
    claimAmount: number
  ): Promise<Claim> {
    const claimId = `claim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const claim: Claim = {
      id: claimId,
      organizationId,
      patientId,
      appointmentId,
      insuranceProvider,
      claimAmount,
      submissionDate: new Date(),
      status: 'submitted',
    };

    if (!claims.has(organizationId)) {
      claims.set(organizationId, []);
    }

    claims.get(organizationId)!.push(claim);

    await logAudit(null, AuditAction.CLAIM_SUBMITTED, 'INSURANCE_CLAIM', claimId, {
      status: 'SUCCESS',
      details: { insuranceProvider, claimAmount },
    });

    return claim;
  }

  static async updateClaimStatus(
    claimId: string,
    status: 'approved' | 'denied' | 'paid',
    approvalAmount?: number,
    denialReason?: string
  ): Promise<Claim | null> {
    // Find claim across all organizations
    let foundClaim: Claim | null = null;

    for (const [, orgClaims] of claims) {
      const claim = orgClaims.find((c) => c.id === claimId);
      if (claim) {
        claim.status = status;
        if (approvalAmount !== undefined) claim.approvalAmount = approvalAmount;
        if (denialReason) claim.denialReason = denialReason;
        foundClaim = claim;
        break;
      }
    }

    if (foundClaim) {
      await logAudit(null, AuditAction.CLAIM_STATUS_UPDATED, 'INSURANCE_CLAIM', claimId, {
        status: 'SUCCESS',
        details: { newStatus: status, approvalAmount },
      });
    }

    return foundClaim;
  }

  static async getInvoices(organizationId: string, status?: string): Promise<Invoice[]> {
    let invoicesList = invoices.get(organizationId) || [];

    if (status) {
      invoicesList = invoicesList.filter((inv) => inv.status === status);
    }

    return invoicesList;
  }

  static async getPayments(organizationId: string, days: number = 30): Promise<Payment[]> {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const paymentsList = payments.get(organizationId) || [];

    return paymentsList.filter((p) => p.timestamp > cutoff);
  }

  static async getClaims(organizationId: string, status?: string): Promise<Claim[]> {
    let claimsList = claims.get(organizationId) || [];

    if (status) {
      claimsList = claimsList.filter((c) => c.status === status);
    }

    return claimsList;
  }

  static async generateReconciliationReport(
    organizationId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<ReconciliationReport> {
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const orgPayments = payments.get(organizationId) || [];
    const orgInvoices = invoices.get(organizationId) || [];

    const periodPayments = orgPayments.filter((p) => p.timestamp >= periodStart && p.timestamp <= periodEnd);
    const periodInvoices = orgInvoices.filter(
      (i) => i.issuedDate >= periodStart && i.issuedDate <= periodEnd
    );

    const totalRevenue = periodInvoices.reduce((sum, i) => sum + i.amount, 0);
    const totalPayments = periodPayments.reduce((sum, p) => sum + p.netAmount, 0);
    const totalRefunds = periodPayments
      .filter((p) => p.status === 'refunded')
      .reduce((sum, p) => sum + p.amount, 0);
    const totalOutstanding = periodInvoices
      .filter((i) => i.status !== 'paid')
      .reduce((sum, i) => sum + i.amount, 0);

    const report: ReconciliationReport = {
      id: reportId,
      organizationId,
      periodStart,
      periodEnd,
      totalRevenue,
      totalPayments,
      totalRefunds,
      totalOutstanding,
      discrepancies: Math.abs(totalRevenue - (totalPayments + totalOutstanding)),
      createdAt: new Date(),
    };

    if (!reconciliationReports.has(organizationId)) {
      reconciliationReports.set(organizationId, []);
    }

    reconciliationReports.get(organizationId)!.push(report);

    return report;
  }

  static async getBillingMetrics(organizationId: string): Promise<{
    totalRevenue: number;
    totalPending: number;
    totalOverdue: number;
    paymentSuccessRate: number;
    averagePaymentTime: number;
    insuranceClaimsApprovalRate: number;
  }> {
    const orgInvoices = invoices.get(organizationId) || [];
    const orgPayments = payments.get(organizationId) || [];
    const orgClaims = claims.get(organizationId) || [];

    const totalRevenue = orgInvoices
      .filter((i) => i.status === 'paid')
      .reduce((sum, i) => sum + i.amount, 0);

    const now = new Date();
    const totalPending = orgInvoices
      .filter((i) => i.status === 'sent' || i.status === 'draft')
      .reduce((sum, i) => sum + i.amount, 0);

    const totalOverdue = orgInvoices
      .filter((i) => i.status === 'overdue' && i.dueDate < now)
      .reduce((sum, i) => sum + i.amount, 0);

    const successRate =
      orgPayments.length > 0
        ? (orgPayments.filter((p) => p.status === 'completed').length / orgPayments.length) * 100
        : 0;

    const avgPaymentTime =
      orgPayments.length > 0
        ? orgPayments.reduce((sum, p) => sum + (p.timestamp.getTime() - new Date().getTime()), 0) /
          orgPayments.length /
          (1000 * 60 * 60 * 24)
        : 0;

    const claimsApprovedCount = orgClaims.filter((c) => c.status === 'approved').length;
    const claimsApprovalRate = orgClaims.length > 0 ? (claimsApprovedCount / orgClaims.length) * 100 : 0;

    return {
      totalRevenue,
      totalPending,
      totalOverdue,
      paymentSuccessRate: Math.round(successRate * 100) / 100,
      averagePaymentTime: Math.round(avgPaymentTime * 100) / 100,
      insuranceClaimsApprovalRate: Math.round(claimsApprovalRate * 100) / 100,
    };
  }

  static async disableBillingConfig(billingConfigId: string): Promise<void> {
    const config = billingConfigs.get(billingConfigId);
    if (config) {
      config.enabled = false;
      config.updatedAt = new Date();
    }

    await logAudit(null, AuditAction.SETTINGS_UPDATED, 'BILLING_CONFIG_DISABLED', billingConfigId, {
      status: 'SUCCESS',
      details: {},
    });
  }
}
