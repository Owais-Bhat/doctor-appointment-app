/**
 * Payment Service
 *
 * Handle payment processing, refunds, and transaction management
 * Integrates with Stripe for payment processing
 */

import { invalidateCacheTag, CacheTTL, CacheTags } from '@/lib/cache/cacheManager';
import { logAuditEvent } from '@/lib/audit/logger';

/**
 * Payment method
 */
export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  BANK_TRANSFER = 'bank_transfer',
  INSURANCE = 'insurance',
  WALLET = 'wallet',
}

/**
 * Payment status
 */
export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

/**
 * Payment transaction
 */
export interface PaymentTransaction {
  transactionId: string;
  appointmentId?: string;
  patientId: string;
  doctorId?: string;
  amount: number; // in cents
  currency: string; // USD, EUR, etc.
  status: PaymentStatus;
  method: PaymentMethod;
  stripePaymentIntentId?: string;
  description: string;
  createdAt: Date;
  completedAt?: Date;
  refundedAt?: Date;
  refundAmount?: number;
  failureReason?: string;
  receiptUrl?: string;
  metadata?: Record<string, any>;
}

/**
 * Invoice
 */
export interface Invoice {
  invoiceId: string;
  transactionId: string;
  patientId: string;
  doctorId?: string;
  amount: number;
  currency: string;
  taxAmount: number;
  totalAmount: number;
  items: InvoiceItem[];
  issuedAt: Date;
  dueDate: Date;
  paidAt?: Date;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  pdfUrl?: string;
  emailSentAt?: Date;
}

/**
 * Invoice line item
 */
export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  taxRate: number;
}

/**
 * Payment service
 */
export class PaymentService {
  private transactions: Map<string, PaymentTransaction> = new Map();
  private invoices: Map<string, Invoice> = new Map();

  private stripeClient: any = null; // TODO: Initialize Stripe

  // Default amounts in cents
  private consultationFee = 5000; // $50
  private followUpFee = 3000; // $30
  private taxRate = 0.08; // 8%

  /**
   * Initialize payment service
   */
  initialize(stripeKey: string): void {
    // TODO: Initialize Stripe client
    // this.stripeClient = new Stripe(stripeKey);
    console.log('[PAYMENT] Service initialized');
  }

  /**
   * Create payment intent
   */
  async createPaymentIntent(
    patientId: string,
    appointmentId: string,
    amount: number,
    description: string,
    userId: string,
    ipAddress: string
  ): Promise<{ clientSecret: string; transactionId: string }> {
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create transaction record
    const transaction: PaymentTransaction = {
      transactionId,
      appointmentId,
      patientId,
      amount,
      currency: 'USD',
      status: PaymentStatus.PENDING,
      method: PaymentMethod.CREDIT_CARD,
      description,
      createdAt: new Date(),
      metadata: {
        appointmentId,
      },
    };

    this.transactions.set(transactionId, transaction);

    // TODO: Create Stripe payment intent
    const clientSecret = `secret_${transactionId}`;

    // Log event
    await logAuditEvent({
      action: 'PAYMENT_INTENT_CREATED',
      resourceType: 'payment',
      resourceId: transactionId,
      userId,
      ipAddress,
      details: {
        patientId,
        appointmentId,
        amount,
      },
    });

    console.log(`[PAYMENT] Intent created: ${transactionId}`);

    return { clientSecret, transactionId };
  }

  /**
   * Process payment
   */
  async processPayment(
    transactionId: string,
    paymentMethodId: string,
    userId: string,
    ipAddress: string
  ): Promise<PaymentTransaction> {
    const transaction = this.transactions.get(transactionId);

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    transaction.status = PaymentStatus.PROCESSING;

    try {
      // TODO: Process with Stripe
      // const result = await this.stripeClient.paymentIntents.confirm(...)

      // Simulate success
      transaction.status = PaymentStatus.COMPLETED;
      transaction.completedAt = new Date();
      transaction.stripePaymentIntentId = `pi_${transactionId}`;

      // Log event
      await logAuditEvent({
        action: 'PAYMENT_PROCESSED',
        resourceType: 'payment',
        resourceId: transactionId,
        userId,
        ipAddress,
        details: {
          patientId: transaction.patientId,
          amount: transaction.amount,
        },
      });

      // Invalidate caches
      invalidateCacheTag(CacheTags.TRANSACTIONS);

      console.log(`[PAYMENT] Processed: ${transactionId}`);

      return transaction;
    } catch (error) {
      transaction.status = PaymentStatus.FAILED;
      transaction.failureReason = (error as Error).message;

      // Log failure
      await logAuditEvent({
        action: 'PAYMENT_FAILED',
        resourceType: 'payment',
        resourceId: transactionId,
        userId,
        ipAddress,
        details: {
          patientId: transaction.patientId,
          reason: transaction.failureReason,
        },
      });

      throw error;
    }
  }

  /**
   * Get transaction
   */
  async getTransaction(
    transactionId: string,
    userId: string,
    ipAddress: string
  ): Promise<PaymentTransaction | null> {
    const transaction = this.transactions.get(transactionId);

    if (transaction) {
      // Log access
      await logAuditEvent({
        action: 'PAYMENT_VIEWED',
        resourceType: 'payment',
        resourceId: transactionId,
        userId,
        ipAddress,
      });
    }

    return transaction || null;
  }

  /**
   * Get patient transactions
   */
  async getPatientTransactions(
    patientId: string,
    userId: string,
    ipAddress: string
  ): Promise<PaymentTransaction[]> {
    const transactions: PaymentTransaction[] = [];

    for (const txn of this.transactions.values()) {
      if (txn.patientId === patientId) {
        transactions.push(txn);
      }
    }

    return transactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Refund transaction
   */
  async refundTransaction(
    transactionId: string,
    refundAmount?: number,
    reason?: string,
    userId?: string,
    ipAddress?: string
  ): Promise<PaymentTransaction> {
    const transaction = this.transactions.get(transactionId);

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.status !== PaymentStatus.COMPLETED) {
      throw new Error('Can only refund completed transactions');
    }

    const amount = refundAmount || transaction.amount;

    try {
      // TODO: Process refund with Stripe
      // const refund = await this.stripeClient.refunds.create(...)

      transaction.status = PaymentStatus.REFUNDED;
      transaction.refundedAt = new Date();
      transaction.refundAmount = amount;

      // Log event
      if (userId && ipAddress) {
        await logAuditEvent({
          action: 'PAYMENT_REFUNDED',
          resourceType: 'payment',
          resourceId: transactionId,
          userId,
          ipAddress,
          details: {
            patientId: transaction.patientId,
            refundAmount: amount,
            reason,
          },
        });
      }

      invalidateCacheTag(CacheTags.TRANSACTIONS);

      console.log(`[PAYMENT] Refunded: ${transactionId}`);

      return transaction;
    } catch (error) {
      throw new Error(`Refund failed: ${(error as Error).message}`);
    }
  }

  /**
   * Generate invoice
   */
  async generateInvoice(
    transactionId: string,
    items: InvoiceItem[],
    userId: string,
    ipAddress: string
  ): Promise<Invoice> {
    const transaction = this.transactions.get(transactionId);

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    const invoiceId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Calculate totals
    let subtotal = 0;
    for (const item of items) {
      subtotal += item.lineTotal;
    }

    const taxAmount = Math.round(subtotal * this.taxRate);
    const totalAmount = subtotal + taxAmount;

    const invoice: Invoice = {
      invoiceId,
      transactionId,
      patientId: transaction.patientId,
      doctorId: transaction.doctorId,
      amount: subtotal,
      currency: transaction.currency,
      taxAmount,
      totalAmount,
      items,
      issuedAt: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      status: 'draft',
    };

    this.invoices.set(invoiceId, invoice);

    // Log event
    await logAuditEvent({
      action: 'INVOICE_GENERATED',
      resourceType: 'invoice',
      resourceId: invoiceId,
      userId,
      ipAddress,
      details: {
        transactionId,
        patientId: transaction.patientId,
        totalAmount,
      },
    });

    console.log(`[PAYMENT] Invoice generated: ${invoiceId}`);

    return invoice;
  }

  /**
   * Send invoice
   */
  async sendInvoice(
    invoiceId: string,
    recipientEmail: string,
    userId: string,
    ipAddress: string
  ): Promise<Invoice> {
    const invoice = this.invoices.get(invoiceId);

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    try {
      // TODO: Send email with invoice PDF
      // await emailService.send(recipientEmail, invoice)

      invoice.status = 'sent';
      invoice.emailSentAt = new Date();

      // Log event
      await logAuditEvent({
        action: 'INVOICE_SENT',
        resourceType: 'invoice',
        resourceId: invoiceId,
        userId,
        ipAddress,
        details: {
          recipientEmail,
        },
      });

      console.log(`[PAYMENT] Invoice sent: ${invoiceId}`);

      return invoice;
    } catch (error) {
      throw new Error(`Failed to send invoice: ${(error as Error).message}`);
    }
  }

  /**
   * Mark invoice as paid
   */
  async markInvoiceAsPaid(
    invoiceId: string,
    userId: string,
    ipAddress: string
  ): Promise<Invoice> {
    const invoice = this.invoices.get(invoiceId);

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    invoice.status = 'paid';
    invoice.paidAt = new Date();

    // Log event
    await logAuditEvent({
      action: 'INVOICE_MARKED_PAID',
      resourceType: 'invoice',
      resourceId: invoiceId,
      userId,
      ipAddress,
    });

    invalidateCacheTag(CacheTags.INVOICES);

    console.log(`[PAYMENT] Marked as paid: ${invoiceId}`);

    return invoice;
  }

  /**
   * Get invoices for patient
   */
  async getPatientInvoices(
    patientId: string,
    userId: string,
    ipAddress: string
  ): Promise<Invoice[]> {
    const invoices: Invoice[] = [];

    for (const invoice of this.invoices.values()) {
      if (invoice.patientId === patientId) {
        invoices.push(invoice);
      }
    }

    return invoices.sort((a, b) => b.issuedAt.getTime() - a.issuedAt.getTime());
  }

  /**
   * Get payment stats
   */
  getPaymentStats(doctorId?: string, period: 'month' | 'quarter' | 'year' = 'month') {
    const now = new Date();
    const startDate = new Date();

    if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'quarter') {
      startDate.setMonth(startDate.getMonth() - 3);
    } else {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    let filteredTxns = Array.from(this.transactions.values()).filter(
      (t) => t.createdAt >= startDate && t.status === PaymentStatus.COMPLETED
    );

    if (doctorId) {
      filteredTxns = filteredTxns.filter((t) => t.doctorId === doctorId);
    }

    const totalRevenue = filteredTxns.reduce((sum, t) => sum + t.amount, 0);
    const transactionCount = filteredTxns.length;
    const avgTransactionValue = transactionCount > 0 ? totalRevenue / transactionCount : 0;

    // Revenue by method
    const revenueByMethod: Record<string, number> = {};
    for (const txn of filteredTxns) {
      revenueByMethod[txn.method] = (revenueByMethod[txn.method] || 0) + txn.amount;
    }

    return {
      totalRevenue,
      transactionCount,
      avgTransactionValue,
      revenueByMethod,
      period: `${startDate.toLocaleDateString()} - ${now.toLocaleDateString()}`,
    };
  }

  /**
   * Calculate consultation fee
   */
  calculateConsultationFee(doctorSpecialty?: string, appointmentType?: string): number {
    let baseFee = this.consultationFee;

    // Specialty multiplier
    const specialtyMultipliers: Record<string, number> = {
      cardiology: 1.3,
      neurology: 1.3,
      orthopedics: 1.2,
      dermatology: 1.1,
    };

    if (doctorSpecialty && specialtyMultipliers[doctorSpecialty.toLowerCase()]) {
      baseFee = Math.round(baseFee * specialtyMultipliers[doctorSpecialty.toLowerCase()]);
    }

    // Type multiplier
    if (appointmentType === 'follow_up') {
      baseFee = this.followUpFee;
    }

    return baseFee;
  }

  /**
   * Clean up old transactions
   */
  cleanup(): number {
    const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);
    let cleaned = 0;

    for (const [id, txn] of this.transactions.entries()) {
      if (
        txn.status === PaymentStatus.FAILED &&
        txn.createdAt < sixMonthsAgo
      ) {
        this.transactions.delete(id);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[PAYMENT] Cleaned up ${cleaned} old failed transactions`);
    }

    return cleaned;
  }
}

/**
 * Global service instance
 */
export const paymentService = new PaymentService();
