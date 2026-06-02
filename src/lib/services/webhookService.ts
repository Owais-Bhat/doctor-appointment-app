/**
 * Webhook Service
 *
 * Manages webhook subscriptions and event delivery
 * Implements retry logic, signature verification, and event queuing
 */

import { WebhookConfig, WebhookEvent, WebhookEventTypeSchema } from '@/lib/validations';
import { logAudit, AuditAction } from '@/lib/audit/logger';
import crypto from 'crypto';

interface StoredWebhook {
  id: string;
  organizationId: string;
  appId: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
  retryPolicy: {
    maxRetries: number;
    backoffSeconds: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface StoredEvent {
  id: string;
  webhookId: string;
  eventType: string;
  resourceId: string;
  resourceType: string;
  timestamp: Date;
  data: Record<string, any>;
  status: 'pending' | 'delivered' | 'failed' | 'archived';
  retryCount: number;
  lastError?: string;
  deliveredAt?: Date;
  nextRetryAt?: Date;
}

const webhooks = new Map<string, StoredWebhook>();
const events = new Map<string, StoredEvent>();
const eventQueue: string[] = [];

export class WebhookService {
  /**
   * Register webhook
   */
  static async registerWebhook(
    organizationId: string,
    appId: string,
    url: string,
    events: string[],
    retryPolicy?: { maxRetries?: number; backoffSeconds?: number }
  ): Promise<{ webhook: StoredWebhook; secret: string }> {
    const webhookId = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const secret = crypto.randomBytes(32).toString('hex');

    const webhook: StoredWebhook = {
      id: webhookId,
      organizationId,
      appId,
      url,
      events,
      secret,
      isActive: true,
      retryPolicy: {
        maxRetries: retryPolicy?.maxRetries || 5,
        backoffSeconds: retryPolicy?.backoffSeconds || 60,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    webhooks.set(webhookId, webhook);

    await logAudit(organizationId, AuditAction.USER_CREATED, 'WEBHOOK', webhookId, {
      status: 'SUCCESS',
      details: { appId, events },
    });

    return {
      webhook,
      secret,
    };
  }

  /**
   * Get webhook
   */
  static async getWebhook(webhookId: string): Promise<StoredWebhook | null> {
    return webhooks.get(webhookId) || null;
  }

  /**
   * List webhooks for app
   */
  static async listWebhooks(organizationId: string, appId: string): Promise<StoredWebhook[]> {
    return Array.from(webhooks.values()).filter(
      (w) => w.organizationId === organizationId && w.appId === appId
    );
  }

  /**
   * Update webhook
   */
  static async updateWebhook(
    webhookId: string,
    updates: {
      url?: string;
      events?: string[];
      isActive?: boolean;
    }
  ): Promise<StoredWebhook> {
    const webhook = webhooks.get(webhookId);

    if (!webhook) {
      throw new Error('Webhook not found');
    }

    Object.assign(webhook, updates, { updatedAt: new Date() });

    return webhook;
  }

  /**
   * Delete webhook
   */
  static async deleteWebhook(webhookId: string): Promise<void> {
    webhooks.delete(webhookId);
  }

  /**
   * Queue event for delivery
   */
  static async queueEvent(
    webhookId: string,
    eventType: string,
    resourceId: string,
    resourceType: string,
    data: Record<string, any>
  ): Promise<void> {
    const webhook = webhooks.get(webhookId);

    if (!webhook || !webhook.isActive) {
      return;
    }

    if (!webhook.events.includes(eventType)) {
      return;
    }

    const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const event: StoredEvent = {
      id: eventId,
      webhookId,
      eventType,
      resourceId,
      resourceType,
      timestamp: new Date(),
      data,
      status: 'pending',
      retryCount: 0,
    };

    events.set(eventId, event);
    eventQueue.push(eventId);
  }

  /**
   * Process event queue
   */
  static async processEventQueue(): Promise<void> {
    while (eventQueue.length > 0) {
      const eventId = eventQueue.shift();

      if (!eventId) continue;

      const event = events.get(eventId);

      if (!event) continue;

      await this.deliverEvent(event);
    }
  }

  /**
   * Deliver event to webhook
   */
  private static async deliverEvent(event: StoredEvent): Promise<void> {
    const webhook = webhooks.get(event.webhookId);

    if (!webhook) {
      return;
    }

    const signature = this.generateSignature(JSON.stringify(event.data), webhook.secret);
    const headers = {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': signature,
      'X-Webhook-ID': webhook.id,
      'X-Event-Type': event.eventType,
      'X-Timestamp': event.timestamp.toISOString(),
    };

    const payload = {
      id: event.id,
      event: event.eventType,
      timestamp: event.timestamp,
      data: event.data,
      resourceId: event.resourceId,
      resourceType: event.resourceType,
    };

    try {
      // Simulated delivery (in production, use actual HTTP client)
      // const response = await fetch(webhook.url, {
      //   method: 'POST',
      //   headers,
      //   body: JSON.stringify(payload),
      //   timeout: 30000,
      // });

      // if (response.ok) {
      event.status = 'delivered';
      event.deliveredAt = new Date();
      // }
    } catch (error) {
      event.retryCount++;

      if (event.retryCount >= webhook.retryPolicy.maxRetries) {
        event.status = 'failed';
        event.lastError = String(error);
      } else {
        event.status = 'pending';
        const delaySeconds =
          webhook.retryPolicy.backoffSeconds * Math.pow(2, event.retryCount - 1);
        event.nextRetryAt = new Date(Date.now() + delaySeconds * 1000);
        eventQueue.push(event.id);
      }
    }
  }

  /**
   * Get event history
   */
  static async getEventHistory(
    webhookId: string,
    limit: number = 100
  ): Promise<StoredEvent[]> {
    return Array.from(events.values())
      .filter((e) => e.webhookId === webhookId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get event details
   */
  static async getEvent(eventId: string): Promise<StoredEvent | null> {
    return events.get(eventId) || null;
  }

  /**
   * Retry failed event
   */
  static async retryEvent(eventId: string): Promise<void> {
    const event = events.get(eventId);

    if (!event) {
      throw new Error('Event not found');
    }

    event.status = 'pending';
    event.retryCount = 0;
    event.nextRetryAt = new Date();
    eventQueue.push(eventId);
  }

  /**
   * Test webhook
   */
  static async testWebhook(webhookId: string): Promise<{ success: boolean; error?: string }> {
    const webhook = webhooks.get(webhookId);

    if (!webhook) {
      return { success: false, error: 'Webhook not found' };
    }

    const testData = {
      test: true,
      timestamp: new Date().toISOString(),
    };

    const signature = this.generateSignature(JSON.stringify(testData), webhook.secret);

    try {
      // Simulated test (in production, use actual HTTP client)
      // const response = await fetch(webhook.url, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'X-Webhook-Signature': signature,
      //     'X-Test': 'true',
      //   },
      //   body: JSON.stringify(testData),
      //   timeout: 10000,
      // });

      // return { success: response.ok };
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  /**
   * Generate webhook signature
   */
  private static generateSignature(data: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  /**
   * Verify webhook signature
   */
  static verifySignature(data: string, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(data, secret);
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  }

  /**
   * Clean up old events
   */
  static async cleanupOldEvents(days: number = 30): Promise<void> {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    for (const [eventId, event] of events.entries()) {
      if (
        event.timestamp < cutoffDate &&
        (event.status === 'delivered' || event.status === 'failed')
      ) {
        event.status = 'archived';
      }
    }
  }
}
