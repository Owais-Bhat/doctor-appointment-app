/**
 * WebSocket Service
 *
 * Manages real-time WebSocket connections for live features
 * Handles typing indicators, presence updates, message delivery
 */

import { logAudit, AuditAction } from '@/lib/audit/logger';

interface WSConnection {
  userId: string;
  roomId: string;
  connectionId: string;
  connectedAt: Date;
  lastActivity: Date;
  isActive: boolean;
}

interface WSMessage {
  id: string;
  type: 'typing' | 'message' | 'presence' | 'call' | 'location' | 'reaction';
  userId: string;
  roomId: string;
  data: Record<string, any>;
  timestamp: Date;
}

interface TypingIndicator {
  userId: string;
  conversationId: string;
  startedAt: Date;
  timeoutMs: number;
}

const activeConnections = new Map<string, WSConnection>();
const roomSubscriptions = new Map<string, Set<string>>();
const typingIndicators = new Map<string, TypingIndicator>();
const messageQueue: WSMessage[] = [];

export class WebSocketService {
  /**
   * Register WebSocket connection
   */
  static async registerConnection(userId: string, roomId: string): Promise<string> {
    const connectionId = this.generateConnectionId();
    const now = new Date();

    const connection: WSConnection = {
      userId,
      roomId,
      connectionId,
      connectedAt: now,
      lastActivity: now,
      isActive: true,
    };

    activeConnections.set(connectionId, connection);

    // Add to room subscriptions
    if (!roomSubscriptions.has(roomId)) {
      roomSubscriptions.set(roomId, new Set());
    }
    roomSubscriptions.get(roomId)!.add(userId);

    await logAudit(userId, AuditAction.LOGIN, 'WEBSOCKET', connectionId, {
      status: 'SUCCESS',
      details: { roomId },
    });

    // Notify others in room
    await this.broadcastPresenceUpdate(roomId, userId, 'online');

    return connectionId;
  }

  /**
   * Unregister WebSocket connection
   */
  static async unregisterConnection(connectionId: string): Promise<void> {
    const connection = activeConnections.get(connectionId);

    if (!connection) {
      return;
    }

    activeConnections.delete(connectionId);

    const room = roomSubscriptions.get(connection.roomId);
    if (room) {
      room.delete(connection.userId);
      if (room.size === 0) {
        roomSubscriptions.delete(connection.roomId);
      }
    }

    await logAudit(connection.userId, AuditAction.LOGOUT, 'WEBSOCKET', connectionId, {
      status: 'SUCCESS',
    });

    // Notify others in room
    await this.broadcastPresenceUpdate(connection.roomId, connection.userId, 'offline');
  }

  /**
   * Queue message for real-time delivery
   */
  static async queueMessage(
    userId: string,
    roomId: string,
    type: 'typing' | 'message' | 'presence' | 'call' | 'location' | 'reaction',
    data: Record<string, any>
  ): Promise<void> {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const message: WSMessage = {
      id: messageId,
      type,
      userId,
      roomId,
      data,
      timestamp: new Date(),
    };

    messageQueue.push(message);

    // Broadcast to room subscribers
    await this.broadcastToRoom(roomId, message);
  }

  /**
   * Send typing indicator
   */
  static async sendTypingIndicator(
    userId: string,
    conversationId: string,
    timeoutMs: number = 3000
  ): Promise<void> {
    const key = `${conversationId}:${userId}`;

    // Clear previous timeout
    if (typingIndicators.has(key)) {
      const indicator = typingIndicators.get(key)!;
      // In production, clear actual timeout
    }

    const now = new Date();
    typingIndicators.set(key, {
      userId,
      conversationId,
      startedAt: now,
      timeoutMs,
    });

    // Queue typing indicator message
    await this.queueMessage(userId, conversationId, 'typing', {
      typingUser: userId,
      conversationId,
    });

    // Schedule automatic clear (simulated)
    await this.scheduleTypingClear(key, timeoutMs);
  }

  /**
   * Clear typing indicator
   */
  static async clearTypingIndicator(userId: string, conversationId: string): Promise<void> {
    const key = `${conversationId}:${userId}`;
    typingIndicators.delete(key);

    // Notify room
    await this.queueMessage(userId, conversationId, 'typing', {
      typingUser: null,
      conversationId,
    });
  }

  /**
   * Get typing users
   */
  static async getTypingUsers(conversationId: string): Promise<string[]> {
    const typingUsers: string[] = [];

    for (const [key, indicator] of typingIndicators.entries()) {
      if (indicator.conversationId === conversationId) {
        const now = new Date();
        const elapsed = now.getTime() - indicator.startedAt.getTime();

        if (elapsed < indicator.timeoutMs) {
          typingUsers.push(indicator.userId);
        } else {
          typingIndicators.delete(key);
        }
      }
    }

    return typingUsers;
  }

  /**
   * Send call notification
   */
  static async sendCallNotification(
    initiatorId: string,
    recipientId: string,
    callId: string,
    roomId: string
  ): Promise<void> {
    await this.queueMessage(initiatorId, roomId, 'call', {
      callId,
      initiator: initiatorId,
      recipient: recipientId,
      status: 'ringing',
    });
  }

  /**
   * Update call status
   */
  static async updateCallStatus(
    callId: string,
    status: 'ringing' | 'connected' | 'ended' | 'failed',
    roomId: string,
    participants: string[]
  ): Promise<void> {
    await this.queueMessage(null, roomId, 'call', {
      callId,
      status,
      participants,
      timestamp: new Date(),
    });
  }

  /**
   * Broadcast message reaction
   */
  static async broadcastReaction(
    userId: string,
    messageId: string,
    emoji: string,
    conversationId: string
  ): Promise<void> {
    await this.queueMessage(userId, conversationId, 'reaction', {
      messageId,
      emoji,
      userId,
      action: 'add',
    });
  }

  /**
   * Get room participants
   */
  static async getRoomParticipants(roomId: string): Promise<string[]> {
    const room = roomSubscriptions.get(roomId);
    return room ? Array.from(room) : [];
  }

  /**
   * Get connection count for room
   */
  static async getRoomConnectionCount(roomId: string): Promise<number> {
    const participants = await this.getRoomParticipants(roomId);
    return participants.length;
  }

  /**
   * Get active connections for user
   */
  static async getUserConnections(userId: string): Promise<WSConnection[]> {
    return Array.from(activeConnections.values()).filter((c) => c.userId === userId);
  }

  /**
   * Process message queue
   */
  static async processMessageQueue(): Promise<void> {
    while (messageQueue.length > 0) {
      const message = messageQueue.shift();

      if (!message) continue;

      // In production, send via WebSocket
      console.log(`[WS] Broadcasting ${message.type} to room ${message.roomId}`);
    }
  }

  /**
   * Broadcast to room subscribers
   */
  private static async broadcastToRoom(roomId: string, message: WSMessage): Promise<void> {
    const participants = await this.getRoomParticipants(roomId);

    for (const userId of participants) {
      // In production, send via WebSocket connection
      console.log(`[WS] Sending ${message.type} to ${userId} in room ${roomId}`);
    }
  }

  /**
   * Broadcast presence update
   */
  private static async broadcastPresenceUpdate(
    roomId: string,
    userId: string,
    status: 'online' | 'offline'
  ): Promise<void> {
    const participants = await this.getRoomParticipants(roomId);

    for (const participantId of participants) {
      if (participantId !== userId) {
        // In production, send via WebSocket
        console.log(`[WS] Notifying ${participantId} that ${userId} is ${status}`);
      }
    }
  }

  /**
   * Schedule typing clear
   */
  private static async scheduleTypingClear(key: string, timeoutMs: number): Promise<void> {
    // In production, use actual timers
    setTimeout(() => {
      typingIndicators.delete(key);
    }, timeoutMs);
  }

  /**
   * Generate connection ID
   */
  private static generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get WebSocket statistics
   */
  static async getWSStatistics(): Promise<{
    activeConnections: number;
    activeRooms: number;
    messageQueueLength: number;
    typingIndicators: number;
  }> {
    return {
      activeConnections: activeConnections.size,
      activeRooms: roomSubscriptions.size,
      messageQueueLength: messageQueue.length,
      typingIndicators: typingIndicators.size,
    };
  }

  /**
   * Cleanup stale connections
   */
  static async cleanupStaleConnections(inactivityMs: number = 300000): Promise<void> {
    const now = new Date();
    const cutoff = new Date(now.getTime() - inactivityMs);

    for (const [connectionId, connection] of activeConnections.entries()) {
      if (connection.lastActivity < cutoff) {
        await this.unregisterConnection(connectionId);
      }
    }
  }

  /**
   * Update connection activity
   */
  static async updateActivity(connectionId: string): Promise<void> {
    const connection = activeConnections.get(connectionId);

    if (connection) {
      connection.lastActivity = new Date();
    }
  }
}
