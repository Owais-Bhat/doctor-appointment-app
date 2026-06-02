/**
 * Messaging Service
 *
 * Manages conversations, messages, and real-time communication
 * Supports direct messages, group chats, and appointment-linked conversations
 */

import { Message, Conversation } from '@/lib/validations';
import { logAudit, AuditAction } from '@/lib/audit/logger';

interface StoredMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: 'doctor' | 'patient' | 'admin';
  content: string;
  contentType: 'text' | 'image' | 'file' | 'voice';
  attachmentUrl?: string;
  attachmentFileName?: string;
  attachmentSize?: number;
  readAt?: Date;
  editedAt?: Date;
  deletedAt?: Date;
  replyTo?: string;
  reactions: Record<string, number>;
  createdAt: Date;
}

interface StoredConversation {
  id: string;
  organizationId: string;
  clinicId?: string;
  participantIds: string[];
  type: 'direct' | 'group' | 'appointment';
  title?: string;
  description?: string;
  appointmentId?: string;
  lastMessage?: string;
  lastMessageAt?: Date;
  messageCount: number;
  unreadCount: Record<string, number>;
  isArchived: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const messages = new Map<string, StoredMessage>();
const conversations = new Map<string, StoredConversation>();
const messageIndex = new Map<string, string[]>();

export class MessagingService {
  /**
   * Create conversation
   */
  static async createConversation(
    organizationId: string,
    participantIds: string[],
    type: 'direct' | 'group' | 'appointment' = 'direct',
    title?: string,
    appointmentId?: string,
    clinicId?: string
  ): Promise<StoredConversation> {
    // Check if direct conversation already exists
    if (type === 'direct' && participantIds.length === 2) {
      const existing = this.findDirectConversation(participantIds, organizationId);
      if (existing) {
        return existing;
      }
    }

    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const unreadCount: Record<string, number> = {};
    participantIds.forEach((id) => (unreadCount[id] = 0));

    const conversation: StoredConversation = {
      id: conversationId,
      organizationId,
      clinicId,
      participantIds,
      type,
      title,
      appointmentId,
      messageCount: 0,
      unreadCount,
      isArchived: false,
      isPinned: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    conversations.set(conversationId, conversation);
    messageIndex.set(conversationId, []);

    await logAudit(participantIds[0], AuditAction.DASHBOARD_ACCESSED, 'CONVERSATION', conversationId, {
      status: 'SUCCESS',
      details: { type, participantCount: participantIds.length },
    });

    return conversation;
  }

  /**
   * Get conversation
   */
  static async getConversation(conversationId: string): Promise<StoredConversation | null> {
    return conversations.get(conversationId) || null;
  }

  /**
   * Get user conversations
   */
  static async getUserConversations(
    userId: string,
    organizationId: string,
    limit: number = 50
  ): Promise<StoredConversation[]> {
    return Array.from(conversations.values())
      .filter((c) => c.organizationId === organizationId && c.participantIds.includes(userId) && !c.isArchived)
      .sort((a, b) => (b.lastMessageAt?.getTime() || 0) - (a.lastMessageAt?.getTime() || 0))
      .slice(0, limit);
  }

  /**
   * Send message
   */
  static async sendMessage(
    conversationId: string,
    senderId: string,
    senderType: 'doctor' | 'patient' | 'admin',
    content: string,
    contentType: 'text' | 'image' | 'file' | 'voice' = 'text',
    attachmentUrl?: string,
    attachmentFileName?: string,
    attachmentSize?: number
  ): Promise<StoredMessage> {
    const conversation = conversations.get(conversationId);

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const message: StoredMessage = {
      id: messageId,
      conversationId,
      senderId,
      senderType,
      content,
      contentType,
      attachmentUrl,
      attachmentFileName,
      attachmentSize,
      reactions: {},
      createdAt: new Date(),
    };

    messages.set(messageId, message);
    const msgIds = messageIndex.get(conversationId) || [];
    msgIds.push(messageId);
    messageIndex.set(conversationId, msgIds);

    // Update conversation
    conversation.lastMessage = content.substring(0, 100);
    conversation.lastMessageAt = new Date();
    conversation.messageCount++;
    conversation.updatedAt = new Date();

    // Mark as unread for other participants
    conversation.participantIds.forEach((id) => {
      if (id !== senderId) {
        conversation.unreadCount[id] = (conversation.unreadCount[id] || 0) + 1;
      }
    });

    await logAudit(senderId, AuditAction.DASHBOARD_ACCESSED, 'MESSAGE', messageId, {
      status: 'SUCCESS',
      details: { contentType, conversationId },
    });

    return message;
  }

  /**
   * Get conversation messages
   */
  static async getMessages(
    conversationId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<StoredMessage[]> {
    const msgIds = messageIndex.get(conversationId) || [];
    return msgIds
      .slice(-limit - offset, -offset || undefined)
      .map((id) => messages.get(id)!)
      .filter((m) => m && !m.deletedAt);
  }

  /**
   * Mark message as read
   */
  static async markMessageAsRead(messageId: string, userId: string): Promise<void> {
    const message = messages.get(messageId);

    if (!message) {
      throw new Error('Message not found');
    }

    if (!message.readAt) {
      message.readAt = new Date();

      const conversation = conversations.get(message.conversationId);
      if (conversation && conversation.unreadCount[userId]) {
        conversation.unreadCount[userId]--;
      }
    }
  }

  /**
   * Mark conversation as read
   */
  static async markConversationAsRead(conversationId: string, userId: string): Promise<void> {
    const conversation = conversations.get(conversationId);

    if (conversation) {
      const msgIds = messageIndex.get(conversationId) || [];
      msgIds.forEach((msgId) => {
        const msg = messages.get(msgId);
        if (msg && !msg.readAt) {
          msg.readAt = new Date();
        }
      });

      conversation.unreadCount[userId] = 0;
    }
  }

  /**
   * Edit message
   */
  static async editMessage(messageId: string, newContent: string): Promise<void> {
    const message = messages.get(messageId);

    if (!message) {
      throw new Error('Message not found');
    }

    message.content = newContent;
    message.editedAt = new Date();
  }

  /**
   * Delete message
   */
  static async deleteMessage(messageId: string): Promise<void> {
    const message = messages.get(messageId);

    if (message) {
      message.deletedAt = new Date();
    }
  }

  /**
   * Add reaction to message
   */
  static async addReaction(messageId: string, emoji: string): Promise<void> {
    const message = messages.get(messageId);

    if (message) {
      message.reactions[emoji] = (message.reactions[emoji] || 0) + 1;
    }
  }

  /**
   * Remove reaction from message
   */
  static async removeReaction(messageId: string, emoji: string): Promise<void> {
    const message = messages.get(messageId);

    if (message && message.reactions[emoji]) {
      message.reactions[emoji]--;
      if (message.reactions[emoji] <= 0) {
        delete message.reactions[emoji];
      }
    }
  }

  /**
   * Archive conversation
   */
  static async archiveConversation(conversationId: string): Promise<void> {
    const conversation = conversations.get(conversationId);

    if (conversation) {
      conversation.isArchived = true;
      conversation.updatedAt = new Date();
    }
  }

  /**
   * Pin conversation
   */
  static async pinConversation(conversationId: string): Promise<void> {
    const conversation = conversations.get(conversationId);

    if (conversation) {
      conversation.isPinned = true;
      conversation.updatedAt = new Date();
    }
  }

  /**
   * Unpin conversation
   */
  static async unpinConversation(conversationId: string): Promise<void> {
    const conversation = conversations.get(conversationId);

    if (conversation) {
      conversation.isPinned = false;
      conversation.updatedAt = new Date();
    }
  }

  /**
   * Get unread count
   */
  static async getUnreadCount(conversationId: string, userId: string): Promise<number> {
    const conversation = conversations.get(conversationId);
    return conversation ? conversation.unreadCount[userId] || 0 : 0;
  }

  /**
   * Get total unread
   */
  static async getTotalUnreadCount(userId: string, organizationId: string): Promise<number> {
    let total = 0;

    for (const conversation of conversations.values()) {
      if (conversation.organizationId === organizationId && conversation.participantIds.includes(userId)) {
        total += conversation.unreadCount[userId] || 0;
      }
    }

    return total;
  }

  /**
   * Search messages
   */
  static async searchMessages(
    conversationId: string,
    query: string,
    limit: number = 20
  ): Promise<StoredMessage[]> {
    const msgIds = messageIndex.get(conversationId) || [];

    return msgIds
      .map((id) => messages.get(id)!)
      .filter((m) => m && !m.deletedAt && m.content.toLowerCase().includes(query.toLowerCase()))
      .slice(-limit);
  }

  /**
   * Find direct conversation
   */
  private static findDirectConversation(
    participantIds: string[],
    organizationId: string
  ): StoredConversation | undefined {
    for (const conv of conversations.values()) {
      if (
        conv.organizationId === organizationId &&
        conv.type === 'direct' &&
        conv.participantIds.length === 2 &&
        participantIds.every((id) => conv.participantIds.includes(id))
      ) {
        return conv;
      }
    }
    return undefined;
  }

  /**
   * Get conversation statistics
   */
  static async getConversationStats(organizationId: string): Promise<{
    totalConversations: number;
    activeConversations: number;
    totalMessages: number;
    averageMessagesPerConversation: number;
  }> {
    const filtered = Array.from(conversations.values()).filter(
      (c) => c.organizationId === organizationId && !c.isArchived
    );

    const totalMessages = filtered.reduce((sum, c) => sum + c.messageCount, 0);

    return {
      totalConversations: filtered.length,
      activeConversations: filtered.filter((c) => c.lastMessageAt).length,
      totalMessages,
      averageMessagesPerConversation: filtered.length > 0 ? totalMessages / filtered.length : 0,
    };
  }
}
