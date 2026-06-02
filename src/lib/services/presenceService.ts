/**
 * Presence Service
 *
 * Tracks user online status, availability, and location
 * Manages real-time presence updates for collaborative features
 */

import { Presence } from '@/lib/validations';
import { logAudit, AuditAction } from '@/lib/audit/logger';

interface StoredPresence {
  userId: string;
  status: 'online' | 'away' | 'do_not_disturb' | 'offline';
  lastActiveAt: Date;
  activeConversations: Set<string>;
  currentLocation?: {
    clinic?: string;
    room?: string;
  };
  updatedAt: Date;
}

const presenceMap = new Map<string, StoredPresence>();
const statusChangeListeners = new Map<string, Function[]>();

export class PresenceService {
  /**
   * Set user status
   */
  static async setStatus(
    userId: string,
    status: 'online' | 'away' | 'do_not_disturb' | 'offline'
  ): Promise<void> {
    const now = new Date();

    if (!presenceMap.has(userId)) {
      presenceMap.set(userId, {
        userId,
        status: 'offline',
        lastActiveAt: now,
        activeConversations: new Set(),
        updatedAt: now,
      });
    }

    const presence = presenceMap.get(userId)!;
    const oldStatus = presence.status;
    presence.status = status;
    presence.lastActiveAt = now;
    presence.updatedAt = now;

    if (oldStatus !== status) {
      await this.notifyStatusChange(userId, status);
    }

    await logAudit(userId, AuditAction.LOGIN, 'PRESENCE', userId, {
      status: 'SUCCESS',
      details: { userStatus: status },
    });
  }

  /**
   * Get user presence
   */
  static async getPresence(userId: string): Promise<StoredPresence | null> {
    return presenceMap.get(userId) || null;
  }

  /**
   * Get multiple users presence
   */
  static async getPresences(userIds: string[]): Promise<Record<string, StoredPresence>> {
    const result: Record<string, StoredPresence> = {};

    for (const userId of userIds) {
      const presence = presenceMap.get(userId);
      if (presence) {
        result[userId] = presence;
      }
    }

    return result;
  }

  /**
   * Set location
   */
  static async setLocation(
    userId: string,
    clinic?: string,
    room?: string
  ): Promise<void> {
    const now = new Date();

    if (!presenceMap.has(userId)) {
      presenceMap.set(userId, {
        userId,
        status: 'online',
        lastActiveAt: now,
        activeConversations: new Set(),
        updatedAt: now,
      });
    }

    const presence = presenceMap.get(userId)!;
    presence.currentLocation = { clinic, room };
    presence.lastActiveAt = now;
    presence.updatedAt = now;
  }

  /**
   * Get location
   */
  static async getLocation(userId: string): Promise<{ clinic?: string; room?: string } | null> {
    const presence = presenceMap.get(userId);
    return presence?.currentLocation || null;
  }

  /**
   * Add active conversation
   */
  static async addActiveConversation(userId: string, conversationId: string): Promise<void> {
    const now = new Date();

    if (!presenceMap.has(userId)) {
      presenceMap.set(userId, {
        userId,
        status: 'online',
        lastActiveAt: now,
        activeConversations: new Set(),
        updatedAt: now,
      });
    }

    const presence = presenceMap.get(userId)!;
    presence.activeConversations.add(conversationId);
    presence.lastActiveAt = now;
    presence.updatedAt = now;
  }

  /**
   * Remove active conversation
   */
  static async removeActiveConversation(userId: string, conversationId: string): Promise<void> {
    const presence = presenceMap.get(userId);

    if (presence) {
      presence.activeConversations.delete(conversationId);
      presence.lastActiveAt = new Date();
      presence.updatedAt = new Date();
    }
  }

  /**
   * Get active conversations
   */
  static async getActiveConversations(userId: string): Promise<string[]> {
    const presence = presenceMap.get(userId);
    return presence ? Array.from(presence.activeConversations) : [];
  }

  /**
   * Check if user is active
   */
  static async isUserActive(userId: string): Promise<boolean> {
    const presence = presenceMap.get(userId);
    return presence?.status === 'online' || presence?.status === 'do_not_disturb';
  }

  /**
   * Get users in clinic
   */
  static async getUsersInClinic(clinicId: string): Promise<string[]> {
    const users: string[] = [];

    for (const presence of presenceMap.values()) {
      if (presence.currentLocation?.clinic === clinicId && presence.status !== 'offline') {
        users.push(presence.userId);
      }
    }

    return users;
  }

  /**
   * Get users in room
   */
  static async getUsersInRoom(clinicId: string, roomId: string): Promise<string[]> {
    const users: string[] = [];

    for (const presence of presenceMap.values()) {
      if (
        presence.currentLocation?.clinic === clinicId &&
        presence.currentLocation?.room === roomId &&
        presence.status !== 'offline'
      ) {
        users.push(presence.userId);
      }
    }

    return users;
  }

  /**
   * Batch update last activity
   */
  static async updateActivity(userId: string): Promise<void> {
    const presence = presenceMap.get(userId);

    if (presence) {
      presence.lastActiveAt = new Date();
      presence.updatedAt = new Date();

      // Auto-resume from away if been inactive
      if (presence.status === 'away') {
        presence.status = 'online';
      }
    }
  }

  /**
   * Cleanup offline users (optional)
   */
  static async cleanupOfflineUsers(inactivityMinutes: number = 30): Promise<void> {
    const now = new Date();
    const cutoff = new Date(now.getTime() - inactivityMinutes * 60 * 1000);

    for (const [userId, presence] of presenceMap.entries()) {
      if (presence.lastActiveAt < cutoff && presence.status !== 'offline') {
        presence.status = 'offline';
        presence.updatedAt = now;

        await this.notifyStatusChange(userId, 'offline');
      }
    }
  }

  /**
   * Get presence summary for organization
   */
  static async getOrganizationPresenceSummary(): Promise<{
    online: number;
    away: number;
    doNotDisturb: number;
    offline: number;
  }> {
    const summary = {
      online: 0,
      away: 0,
      doNotDisturb: 0,
      offline: 0,
    };

    for (const presence of presenceMap.values()) {
      switch (presence.status) {
        case 'online':
          summary.online++;
          break;
        case 'away':
          summary.away++;
          break;
        case 'do_not_disturb':
          summary.doNotDisturb++;
          break;
        case 'offline':
          summary.offline++;
          break;
      }
    }

    return summary;
  }

  /**
   * Register status change listener
   */
  static async registerStatusListener(
    userId: string,
    listener: (status: string) => void
  ): Promise<void> {
    if (!statusChangeListeners.has(userId)) {
      statusChangeListeners.set(userId, []);
    }

    statusChangeListeners.get(userId)!.push(listener);
  }

  /**
   * Notify status change
   */
  private static async notifyStatusChange(userId: string, newStatus: string): Promise<void> {
    const listeners = statusChangeListeners.get(userId) || [];

    for (const listener of listeners) {
      try {
        listener(newStatus);
      } catch (error) {
        console.error(`Error in status listener for ${userId}:`, error);
      }
    }
  }

  /**
   * Get status emoji
   */
  static getStatusEmoji(status: string): string {
    switch (status) {
      case 'online':
        return '🟢';
      case 'away':
        return '🟡';
      case 'do_not_disturb':
        return '🔴';
      case 'offline':
        return '⚫';
      default:
        return '⚪';
    }
  }

  /**
   * Get status display text
   */
  static getStatusText(status: string): string {
    switch (status) {
      case 'online':
        return 'Online';
      case 'away':
        return 'Away';
      case 'do_not_disturb':
        return 'Do Not Disturb';
      case 'offline':
        return 'Offline';
      default:
        return 'Unknown';
    }
  }

  /**
   * Get doctor availability
   */
  static async getDoctorAvailability(doctorId: string): Promise<{
    isAvailable: boolean;
    status: string;
    location?: { clinic?: string; room?: string };
    activeConversations: number;
  }> {
    const presence = presenceMap.get(doctorId);

    if (!presence) {
      return {
        isAvailable: false,
        status: 'offline',
        activeConversations: 0,
      };
    }

    return {
      isAvailable: presence.status === 'online' || presence.status === 'do_not_disturb',
      status: presence.status,
      location: presence.currentLocation,
      activeConversations: presence.activeConversations.size,
    };
  }
}
