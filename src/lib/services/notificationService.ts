/**
 * Notification Service
 *
 * Manages notifications, push notifications, and delivery channels
 * Supports in-app, email, SMS, and push notifications
 */

import { Notification, PushToken } from '@/lib/validations';
import { logAudit, AuditAction } from '@/lib/audit/logger';

interface StoredNotification {
  id: string;
  recipientId: string;
  senderId?: string;
  organizationId: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  resourceType?: string;
  resourceId?: string;
  priority: 'low' | 'normal' | 'high';
  isRead: boolean;
  readAt?: Date;
  sentVia: ('in_app' | 'email' | 'sms' | 'push')[];
  sentAt: Date;
  createdAt: Date;
}

interface StoredPushToken {
  id: string;
  userId: string;
  deviceId: string;
  platform: 'ios' | 'android' | 'web';
  token: string;
  isActive: boolean;
  lastUsed?: Date;
  createdAt: Date;
  expiresAt?: Date;
}

const notifications = new Map<string, StoredNotification>();
const pushTokens = new Map<string, StoredPushToken>();
const userPushTokens = new Map<string, Set<string>>();

export class NotificationService {
  /**
   * Send notification
   */
  static async sendNotification(
    recipientId: string,
    organizationId: string,
    type: string,
    title: string,
    message: string,
    channels: ('in_app' | 'email' | 'sms' | 'push')[] = ['in_app'],
    options?: {
      senderId?: string;
      actionUrl?: string;
      actionLabel?: string;
      resourceType?: string;
      resourceId?: string;
      priority?: 'low' | 'normal' | 'high';
    }
  ): Promise<StoredNotification> {
    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const notification: StoredNotification = {
      id: notificationId,
      recipientId,
      organizationId,
      type,
      title,
      message,
      sentVia: channels,
      sentAt: new Date(),
      isRead: false,
      priority: options?.priority || 'normal',
      senderId: options?.senderId,
      actionUrl: options?.actionUrl,
      actionLabel: options?.actionLabel,
      resourceType: options?.resourceType,
      resourceId: options?.resourceId,
      createdAt: new Date(),
    };

    notifications.set(notificationId, notification);

    // Send via channels
    if (channels.includes('push')) {
      await this.sendPushNotification(recipientId, notification);
    }
    if (channels.includes('email')) {
      await this.sendEmailNotification(recipientId, notification);
    }
    if (channels.includes('sms')) {
      await this.sendSMSNotification(recipientId, notification);
    }

    await logAudit(options?.senderId || null, AuditAction.DASHBOARD_ACCESSED, 'NOTIFICATION', notificationId, {
      status: 'SUCCESS',
      details: { type, channels, recipientId },
    });

    return notification;
  }

  /**
   * Register push token
   */
  static async registerPushToken(
    userId: string,
    deviceId: string,
    platform: 'ios' | 'android' | 'web',
    token: string,
    expiresAt?: Date
  ): Promise<StoredPushToken> {
    const tokenId = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const pushToken: StoredPushToken = {
      id: tokenId,
      userId,
      deviceId,
      platform,
      token,
      isActive: true,
      createdAt: new Date(),
      expiresAt,
    };

    pushTokens.set(tokenId, pushToken);

    if (!userPushTokens.has(userId)) {
      userPushTokens.set(userId, new Set());
    }
    userPushTokens.get(userId)!.add(tokenId);

    await logAudit(userId, AuditAction.MOBILE_SDK_CONFIG_UPDATED, 'PUSH_TOKEN', tokenId, {
      status: 'SUCCESS',
      details: { platform, deviceId },
    });

    return pushToken;
  }

  /**
   * Get user's push tokens
   */
  static async getUserPushTokens(userId: string): Promise<StoredPushToken[]> {
    const tokenIds = userPushTokens.get(userId) || new Set();

    return Array.from(tokenIds)
      .map((id) => pushTokens.get(id)!)
      .filter((t) => t && t.isActive);
  }

  /**
   * Revoke push token
   */
  static async revokePushToken(tokenId: string): Promise<void> {
    const token = pushTokens.get(tokenId);

    if (token) {
      token.isActive = false;
    }
  }

  /**
   * Get user notifications
   */
  static async getUserNotifications(
    userId: string,
    organizationId: string,
    limit: number = 50,
    unreadOnly: boolean = false
  ): Promise<StoredNotification[]> {
    return Array.from(notifications.values())
      .filter(
        (n) =>
          n.recipientId === userId &&
          n.organizationId === organizationId &&
          (!unreadOnly || !n.isRead)
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  /**
   * Mark notification as read
   */
  static async markNotificationAsRead(notificationId: string): Promise<void> {
    const notification = notifications.get(notificationId);

    if (notification && !notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
    }
  }

  /**
   * Mark all as read
   */
  static async markAllAsRead(userId: string, organizationId: string): Promise<void> {
    for (const notification of notifications.values()) {
      if (
        notification.recipientId === userId &&
        notification.organizationId === organizationId &&
        !notification.isRead
      ) {
        notification.isRead = true;
        notification.readAt = new Date();
      }
    }
  }

  /**
   * Get unread count
   */
  static async getUnreadCount(userId: string, organizationId: string): Promise<number> {
    return Array.from(notifications.values()).filter(
      (n) => n.recipientId === userId && n.organizationId === organizationId && !n.isRead
    ).length;
  }

  /**
   * Delete notification
   */
  static async deleteNotification(notificationId: string): Promise<void> {
    notifications.delete(notificationId);
  }

  /**
   * Send push notification
   */
  private static async sendPushNotification(
    userId: string,
    notification: StoredNotification
  ): Promise<void> {
    const tokens = await this.getUserPushTokens(userId);

    for (const token of tokens) {
      try {
        // Simulated push notification send
        // In production, use Firebase Cloud Messaging, APNs, or similar
        console.log(`[PUSH] Sending to ${token.platform} device: ${notification.title}`);

        token.lastUsed = new Date();
      } catch (error) {
        console.error(`Failed to send push to token ${token.id}:`, error);
      }
    }
  }

  /**
   * Send email notification
   */
  private static async sendEmailNotification(
    userId: string,
    notification: StoredNotification
  ): Promise<void> {
    try {
      // Simulated email send
      // In production, use SendGrid, AWS SES, or similar
      console.log(`[EMAIL] Sending to user ${userId}: ${notification.title}`);
    } catch (error) {
      console.error(`Failed to send email to user ${userId}:`, error);
    }
  }

  /**
   * Send SMS notification
   */
  private static async sendSMSNotification(
    userId: string,
    notification: StoredNotification
  ): Promise<void> {
    try {
      // Simulated SMS send
      // In production, use Twilio, AWS SNS, or similar
      console.log(`[SMS] Sending to user ${userId}: ${notification.message}`);
    } catch (error) {
      console.error(`Failed to send SMS to user ${userId}:`, error);
    }
  }

  /**
   * Create notification templates
   */
  static createAppointmentReminder(
    patientId: string,
    organizationId: string,
    doctorName: string,
    appointmentTime: Date
  ): Parameters<typeof this.sendNotification> {
    const time = appointmentTime.toLocaleString();

    return [
      patientId,
      organizationId,
      'appointment_reminder',
      `Appointment Reminder`,
      `Your appointment with Dr. ${doctorName} is scheduled for ${time}`,
      ['in_app', 'email', 'push'],
      {
        priority: 'high',
        actionLabel: 'View Details',
        resourceType: 'appointment',
      },
    ];
  }

  static createMessageNotification(
    recipientId: string,
    organizationId: string,
    senderName: string,
    conversationId: string
  ): Parameters<typeof this.sendNotification> {
    return [
      recipientId,
      organizationId,
      'message_received',
      `New message from ${senderName}`,
      `You have a new message`,
      ['in_app', 'push'],
      {
        actionUrl: `/messages/${conversationId}`,
        actionLabel: 'View Message',
        resourceType: 'conversation',
        resourceId: conversationId,
      },
    ];
  }

  static createConsultationStarted(
    patientId: string,
    organizationId: string,
    doctorName: string,
    consultationId: string
  ): Parameters<typeof this.sendNotification> {
    return [
      patientId,
      organizationId,
      'consultation_started',
      `Dr. ${doctorName} is ready`,
      `Your video consultation is starting`,
      ['in_app', 'push'],
      {
        priority: 'high',
        actionUrl: `/consultations/${consultationId}`,
        actionLabel: 'Join Now',
        resourceType: 'consultation',
        resourceId: consultationId,
      },
    ];
  }

  static createPaymentReceived(
    patientId: string,
    organizationId: string,
    amount: number
  ): Parameters<typeof this.sendNotification> {
    return [
      patientId,
      organizationId,
      'payment_received',
      `Payment Confirmed`,
      `Payment of $${amount.toFixed(2)} has been received`,
      ['in_app', 'email'],
      {
        resourceType: 'payment',
      },
    ];
  }

  /**
   * Cleanup expired tokens
   */
  static async cleanupExpiredTokens(): Promise<void> {
    const now = new Date();

    for (const [tokenId, token] of pushTokens.entries()) {
      if (token.expiresAt && token.expiresAt < now) {
        token.isActive = false;
      }
    }
  }

  /**
   * Get notification statistics
   */
  static async getNotificationStats(organizationId: string): Promise<{
    totalSent: number;
    unreadCount: number;
    byChannel: Record<string, number>;
    byType: Record<string, number>;
  }> {
    const filtered = Array.from(notifications.values()).filter(
      (n) => n.organizationId === organizationId
    );

    const byChannel: Record<string, number> = {};
    const byType: Record<string, number> = {};

    filtered.forEach((n) => {
      n.sentVia.forEach((channel) => {
        byChannel[channel] = (byChannel[channel] || 0) + 1;
      });
      byType[n.type] = (byType[n.type] || 0) + 1;
    });

    return {
      totalSent: filtered.length,
      unreadCount: filtered.filter((n) => !n.isRead).length,
      byChannel,
      byType,
    };
  }
}
