/**
 * Chat Manager
 *
 * Real-time messaging during video consultations
 * Handles message history, typing indicators, file sharing
 */

/**
 * Chat message
 */
export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'file' | 'system';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  isRead: boolean;
}

/**
 * Typing indicator
 */
export interface TypingIndicator {
  userId: string;
  isTyping: boolean;
  timestamp: Date;
}

/**
 * Chat channel options
 */
export interface ChatChannelOptions {
  maxMessages: number;
  messageRetentionMs: number;
  enableFileSharing: boolean;
  maxFileSize: number;
}

/**
 * Chat manager class
 */
export class ChatManager {
  private messages: Map<string, ChatMessage[]> = new Map();
  private typingIndicators: Map<string, TypingIndicator> = new Map();
  private messageListeners: ((message: ChatMessage) => void)[] = [];
  private typingListeners: ((indicator: TypingIndicator) => void)[] = [];
  private readListeners: ((messageId: string) => void)[] = [];

  private options: ChatChannelOptions = {
    maxMessages: 1000,
    messageRetentionMs: 24 * 60 * 60 * 1000, // 24 hours
    enableFileSharing: true,
    maxFileSize: 50 * 1024 * 1024, // 50 MB
  };

  /**
   * Initialize chat manager
   */
  initialize(channelId: string, options?: Partial<ChatChannelOptions>): void {
    if (options) {
      this.options = { ...this.options, ...options };
    }

    if (!this.messages.has(channelId)) {
      this.messages.set(channelId, []);
    }

    console.log(`[CHAT] Initialized for channel: ${channelId}`);
  }

  /**
   * Send message
   */
  sendMessage(
    channelId: string,
    senderId: string,
    senderName: string,
    content: string
  ): ChatMessage {
    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      senderId,
      senderName,
      content,
      timestamp: new Date(),
      type: 'text',
      isRead: false,
    };

    // Add to channel
    const messages = this.messages.get(channelId) || [];
    messages.push(message);

    // Trim old messages if exceeds limit
    if (messages.length > this.options.maxMessages) {
      messages.shift();
    }

    this.messages.set(channelId, messages);

    // Notify listeners
    this.messageListeners.forEach((listener) => listener(message));

    console.log(`[CHAT] Message sent: ${message.id}`);

    return message;
  }

  /**
   * Share file in chat
   */
  async shareFile(
    channelId: string,
    senderId: string,
    senderName: string,
    file: File,
    fileUrl: string
  ): Promise<ChatMessage> {
    // Validate file
    if (file.size > this.options.maxFileSize) {
      throw new Error(`File size exceeds ${this.options.maxFileSize / 1024 / 1024}MB limit`);
    }

    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      senderId,
      senderName,
      content: `Shared file: ${file.name}`,
      timestamp: new Date(),
      type: 'file',
      fileUrl,
      fileName: file.name,
      fileSize: file.size,
      isRead: false,
    };

    // Add to channel
    const messages = this.messages.get(channelId) || [];
    messages.push(message);

    this.messages.set(channelId, messages);

    // Notify listeners
    this.messageListeners.forEach((listener) => listener(message));

    console.log(`[CHAT] File shared: ${message.id}`);

    return message;
  }

  /**
   * Get message history
   */
  getMessageHistory(channelId: string, limit: number = 100): ChatMessage[] {
    const messages = this.messages.get(channelId) || [];
    return messages.slice(-limit);
  }

  /**
   * Mark message as read
   */
  markAsRead(channelId: string, messageId: string): void {
    const messages = this.messages.get(channelId);
    if (messages) {
      const message = messages.find((m) => m.id === messageId);
      if (message) {
        message.isRead = true;
        this.readListeners.forEach((listener) => listener(messageId));
      }
    }
  }

  /**
   * Set typing indicator
   */
  setTypingIndicator(
    channelId: string,
    userId: string,
    isTyping: boolean
  ): void {
    const key = `${channelId}:${userId}`;
    const indicator: TypingIndicator = {
      userId,
      isTyping,
      timestamp: new Date(),
    };

    this.typingIndicators.set(key, indicator);

    // Notify listeners
    this.typingListeners.forEach((listener) => listener(indicator));

    // Clear after 3 seconds of inactivity
    if (isTyping) {
      setTimeout(() => {
        this.setTypingIndicator(channelId, userId, false);
      }, 3000);
    }
  }

  /**
   * Get typing indicators for channel
   */
  getTypingIndicators(channelId: string): TypingIndicator[] {
    const indicators: TypingIndicator[] = [];

    for (const [key, indicator] of this.typingIndicators.entries()) {
      if (key.startsWith(`${channelId}:`)) {
        // Check if still valid (less than 3 seconds old)
        const age = Date.now() - indicator.timestamp.getTime();
        if (age < 3000 && indicator.isTyping) {
          indicators.push(indicator);
        }
      }
    }

    return indicators;
  }

  /**
   * Subscribe to messages
   */
  onMessage(callback: (message: ChatMessage) => void): () => void {
    this.messageListeners.push(callback);

    // Return unsubscribe function
    return () => {
      this.messageListeners = this.messageListeners.filter((l) => l !== callback);
    };
  }

  /**
   * Subscribe to typing indicators
   */
  onTyping(callback: (indicator: TypingIndicator) => void): () => void {
    this.typingListeners.push(callback);

    return () => {
      this.typingListeners = this.typingListeners.filter((l) => l !== callback);
    };
  }

  /**
   * Subscribe to read receipts
   */
  onRead(callback: (messageId: string) => void): () => void {
    this.readListeners.push(callback);

    return () => {
      this.readListeners = this.readListeners.filter((l) => l !== callback);
    };
  }

  /**
   * Get unread count
   */
  getUnreadCount(channelId: string): number {
    const messages = this.messages.get(channelId) || [];
    return messages.filter((m) => !m.isRead).length;
  }

  /**
   * Clear channel history
   */
  clearHistory(channelId: string): void {
    this.messages.delete(channelId);
    console.log(`[CHAT] History cleared for channel: ${channelId}`);
  }

  /**
   * Get chat stats
   */
  getStats(channelId: string) {
    const messages = this.messages.get(channelId) || [];
    return {
      totalMessages: messages.length,
      unreadMessages: messages.filter((m) => !m.isRead).length,
      fileShares: messages.filter((m) => m.type === 'file').length,
      typingUsers: this.getTypingIndicators(channelId).length,
    };
  }

  /**
   * Clean up old messages
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [channelId, messages] of this.messages.entries()) {
      const filtered = messages.filter((m) => now - m.timestamp.getTime() < this.options.messageRetentionMs);
      cleaned += messages.length - filtered.length;
      if (filtered.length > 0) {
        this.messages.set(channelId, filtered);
      } else {
        this.messages.delete(channelId);
      }
    }

    if (cleaned > 0) {
      console.log(`[CHAT] Cleaned up ${cleaned} expired messages`);
    }

    return cleaned;
  }
}

/**
 * Global chat manager instance
 */
export const chatManager = new ChatManager();
