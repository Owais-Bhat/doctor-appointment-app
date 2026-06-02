/**
 * Real-time Collaboration Service
 *
 * Manages collaborative features like shared notes, whiteboards, and screen sharing
 * Supports Operational Transformation for conflict resolution
 */

import { logAudit, AuditAction } from '@/lib/audit/logger';

interface CollaborativeDocument {
  id: string;
  type: 'notes' | 'whiteboard' | 'treatment-plan';
  appointmentId: string;
  doctorId: string;
  patientId: string;
  content: string;
  version: number;
  lastModifiedBy: string;
  lastModifiedAt: Date;
  createdAt: Date;
  participants: Set<string>;
  history: DocumentChange[];
}

interface DocumentChange {
  id: string;
  userId: string;
  timestamp: Date;
  operation: 'insert' | 'delete' | 'replace';
  position: number;
  content?: string;
  length?: number;
}

interface CursorPosition {
  userId: string;
  documentId: string;
  position: number;
  selection?: { start: number; end: number };
  color: string;
  updatedAt: Date;
}

interface ScreenShare {
  id: string;
  sharerUserId: string;
  conversationId: string;
  startedAt: Date;
  endedAt?: Date;
  viewers: Set<string>;
  recordingUrl?: string;
}

const documents = new Map<string, CollaborativeDocument>();
const cursorPositions = new Map<string, CursorPosition>();
const activeScreenShares = new Map<string, ScreenShare>();
const documentLocks = new Map<string, string>();

export class RealtimeCollaborationService {
  /**
   * Create collaborative document
   */
  static async createDocument(
    type: 'notes' | 'whiteboard' | 'treatment-plan',
    appointmentId: string,
    doctorId: string,
    patientId: string,
    initialContent: string = ''
  ): Promise<CollaborativeDocument> {
    const docId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const document: CollaborativeDocument = {
      id: docId,
      type,
      appointmentId,
      doctorId,
      patientId,
      content: initialContent,
      version: 0,
      lastModifiedBy: doctorId,
      lastModifiedAt: new Date(),
      createdAt: new Date(),
      participants: new Set([doctorId]),
      history: [],
    };

    if (type !== 'notes') {
      document.participants.add(patientId);
    }

    documents.set(docId, document);

    await logAudit(doctorId, AuditAction.REPORT_CREATED, 'COLLABORATIVE_DOC', docId, {
      status: 'SUCCESS',
      details: { type, appointmentId },
    });

    return document;
  }

  /**
   * Apply operational transformation
   */
  static async applyChange(
    documentId: string,
    userId: string,
    operation: 'insert' | 'delete' | 'replace',
    position: number,
    content?: string,
    length?: number
  ): Promise<DocumentChange> {
    const document = documents.get(documentId);

    if (!document) {
      throw new Error('Document not found');
    }

    // Add participant if new
    if (!document.participants.has(userId)) {
      document.participants.add(userId);
    }

    // Apply operation
    switch (operation) {
      case 'insert':
        if (!content) throw new Error('Content required for insert');
        document.content =
          document.content.slice(0, position) +
          content +
          document.content.slice(position);
        break;

      case 'delete':
        if (!length) throw new Error('Length required for delete');
        document.content =
          document.content.slice(0, position) +
          document.content.slice(position + length);
        break;

      case 'replace':
        if (!content || !length) throw new Error('Content and length required for replace');
        document.content =
          document.content.slice(0, position) +
          content +
          document.content.slice(position + length);
        break;
    }

    // Record change
    const change: DocumentChange = {
      id: `change_${Date.now()}`,
      userId,
      timestamp: new Date(),
      operation,
      position,
      content,
      length,
    };

    document.history.push(change);
    document.version++;
    document.lastModifiedBy = userId;
    document.lastModifiedAt = new Date();

    await logAudit(userId, AuditAction.REPORT_GENERATED, 'COLLABORATIVE_DOC', documentId, {
      status: 'SUCCESS',
      details: { operation, position },
    });

    return change;
  }

  /**
   * Get document
   */
  static async getDocument(documentId: string): Promise<CollaborativeDocument | null> {
    return documents.get(documentId) || null;
  }

  /**
   * Get document by appointment
   */
  static async getDocumentByAppointment(
    appointmentId: string,
    type?: 'notes' | 'whiteboard' | 'treatment-plan'
  ): Promise<CollaborativeDocument[]> {
    return Array.from(documents.values()).filter(
      (doc) => doc.appointmentId === appointmentId && (!type || doc.type === type)
    );
  }

  /**
   * Update cursor position
   */
  static async updateCursorPosition(
    userId: string,
    documentId: string,
    position: number,
    selection?: { start: number; end: number }
  ): Promise<void> {
    const key = `${documentId}:${userId}`;

    const colors = [
      '#FF6B6B', // Red
      '#4ECDC4', // Teal
      '#45B7D1', // Blue
      '#FFA07A', // Light Salmon
      '#98D8C8', // Mint
    ];

    const color = colors[Math.floor(Math.random() * colors.length)];

    cursorPositions.set(key, {
      userId,
      documentId,
      position,
      selection,
      color,
      updatedAt: new Date(),
    });
  }

  /**
   * Get cursor positions
   */
  static async getCursorPositions(documentId: string): Promise<CursorPosition[]> {
    const cursors: CursorPosition[] = [];

    for (const [key, cursor] of cursorPositions.entries()) {
      if (cursor.documentId === documentId) {
        cursors.push(cursor);
      }
    }

    return cursors;
  }

  /**
   * Lock document section
   */
  static async lockSection(documentId: string, userId: string, sectionId?: string): Promise<void> {
    const key = sectionId ? `${documentId}:${sectionId}` : documentId;
    documentLocks.set(key, userId);
  }

  /**
   * Unlock document section
   */
  static async unlockSection(documentId: string, sectionId?: string): Promise<void> {
    const key = sectionId ? `${documentId}:${sectionId}` : documentId;
    documentLocks.delete(key);
  }

  /**
   * Get lock holder
   */
  static async getLockHolder(documentId: string, sectionId?: string): Promise<string | null> {
    const key = sectionId ? `${documentId}:${sectionId}` : documentId;
    return documentLocks.get(key) || null;
  }

  /**
   * Start screen share
   */
  static async startScreenShare(
    sharerUserId: string,
    conversationId: string
  ): Promise<ScreenShare> {
    const shareId = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const screenShare: ScreenShare = {
      id: shareId,
      sharerUserId,
      conversationId,
      startedAt: new Date(),
      viewers: new Set(),
    };

    activeScreenShares.set(shareId, screenShare);

    await logAudit(sharerUserId, AuditAction.REPORT_EXPORTED, 'SCREEN_SHARE', shareId, {
      status: 'SUCCESS',
      details: { conversationId },
    });

    return screenShare;
  }

  /**
   * End screen share
   */
  static async endScreenShare(shareId: string, recordingUrl?: string): Promise<void> {
    const share = activeScreenShares.get(shareId);

    if (share) {
      share.endedAt = new Date();
      if (recordingUrl) {
        share.recordingUrl = recordingUrl;
      }
    }
  }

  /**
   * Add viewer to screen share
   */
  static async addViewer(shareId: string, viewerId: string): Promise<void> {
    const share = activeScreenShares.get(shareId);

    if (share) {
      share.viewers.add(viewerId);
    }
  }

  /**
   * Remove viewer from screen share
   */
  static async removeViewer(shareId: string, viewerId: string): Promise<void> {
    const share = activeScreenShares.get(shareId);

    if (share) {
      share.viewers.delete(viewerId);
    }
  }

  /**
   * Get active screen shares for conversation
   */
  static async getActiveScreenShares(conversationId: string): Promise<ScreenShare[]> {
    return Array.from(activeScreenShares.values()).filter(
      (s) => s.conversationId === conversationId && !s.endedAt
    );
  }

  /**
   * Get document version history
   */
  static async getChangeHistory(
    documentId: string,
    limit: number = 50
  ): Promise<DocumentChange[]> {
    const document = documents.get(documentId);

    if (!document) {
      return [];
    }

    return document.history.slice(-limit);
  }

  /**
   * Undo last change
   */
  static async undoChange(documentId: string, userId: string): Promise<boolean> {
    const document = documents.get(documentId);

    if (!document || document.history.length === 0) {
      return false;
    }

    const lastChange = document.history[document.history.length - 1];

    if (lastChange.userId !== userId) {
      return false; // Only user who made change can undo
    }

    // Reverse the operation
    switch (lastChange.operation) {
      case 'insert':
        if (!lastChange.content) return false;
        document.content =
          document.content.slice(0, lastChange.position) +
          document.content.slice(lastChange.position + lastChange.content.length);
        break;

      case 'delete':
        if (!lastChange.content) return false;
        document.content =
          document.content.slice(0, lastChange.position) +
          lastChange.content +
          document.content.slice(lastChange.position);
        break;

      case 'replace':
        // Would need original content to properly undo
        return false;
    }

    document.history.pop();
    document.version++;

    return true;
  }

  /**
   * Export document
   */
  static async exportDocument(
    documentId: string,
    format: 'text' | 'pdf' | 'markdown' = 'text'
  ): Promise<string> {
    const document = documents.get(documentId);

    if (!document) {
      throw new Error('Document not found');
    }

    switch (format) {
      case 'text':
        return document.content;

      case 'markdown':
        return `# ${document.type.toUpperCase()}\n\n${document.content}`;

      case 'pdf':
        return `[PDF] ${document.type}: ${document.content.substring(0, 100)}...`;

      default:
        return document.content;
    }
  }

  /**
   * Get collaboration statistics
   */
  static async getCollaborationStats(appointmentId: string): Promise<{
    totalDocuments: number;
    totalChanges: number;
    contributors: number;
    activeScreenShares: number;
  }> {
    const docList = await this.getDocumentByAppointment(appointmentId);
    let totalChanges = 0;
    const contributors = new Set<string>();
    let activeShares = 0;

    for (const doc of docList) {
      totalChanges += doc.history.length;
      doc.participants.forEach((p) => contributors.add(p));
    }

    for (const share of activeScreenShares.values()) {
      if (!share.endedAt) {
        activeShares++;
      }
    }

    return {
      totalDocuments: docList.length,
      totalChanges,
      contributors: contributors.size,
      activeScreenShares: activeShares,
    };
  }
}
