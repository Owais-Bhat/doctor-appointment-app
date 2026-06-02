/**
 * API Key Service
 *
 * Manages API key generation, validation, and revocation
 * Tracks API key usage and enforces rate limits
 */

import { APIKey, OAuthScopeSchema } from '@/lib/validations';
import { logAudit, AuditAction } from '@/lib/audit/logger';
import crypto from 'crypto';

interface StoredAPIKey {
  id: string;
  organizationId: string;
  appId: string;
  keyPrefix: string;
  hashedKey: string;
  name: string;
  scopes: string[];
  rateLimit: number;
  createdAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  lastUsed?: Date;
}

interface APIKeyUsage {
  keyId: string;
  requestCount: number;
  resetAt: Date;
}

const apiKeys = new Map<string, StoredAPIKey>();
const keyUsage = new Map<string, APIKeyUsage>();
const revokedKeys = new Set<string>();

export class APIKeyService {
  /**
   * Generate new API key
   */
  static async generateAPIKey(
    organizationId: string,
    appId: string,
    name: string,
    scopes: string[],
    rateLimit: number = 1000,
    expiresAt?: Date
  ): Promise<{ key: string; keyId: string }> {
    const rawKey = `sk_${organizationId}_${Date.now()}_${crypto.randomBytes(32).toString('hex')}`;
    const hashedKey = this.hashKey(rawKey);
    const keyPrefix = rawKey.substring(0, 10);
    const keyId = `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const apiKey: StoredAPIKey = {
      id: keyId,
      organizationId,
      appId,
      keyPrefix,
      hashedKey,
      name,
      scopes,
      rateLimit,
      createdAt: new Date(),
      expiresAt,
      isActive: true,
    };

    apiKeys.set(keyId, apiKey);

    await logAudit(organizationId, AuditAction.USER_CREATED, 'API_KEY', keyId, {
      status: 'SUCCESS',
      details: { appId, scopes },
    });

    return {
      key: rawKey,
      keyId,
    };
  }

  /**
   * Validate API key
   */
  static async validateAPIKey(
    rawKey: string,
    ipAddress?: string
  ): Promise<{ valid: boolean; key?: StoredAPIKey; message?: string }> {
    if (!rawKey.startsWith('sk_')) {
      return { valid: false, message: 'Invalid key format' };
    }

    const hashedKey = this.hashKey(rawKey);
    let foundKey: StoredAPIKey | undefined;

    for (const key of apiKeys.values()) {
      if (key.hashedKey === hashedKey) {
        foundKey = key;
        break;
      }
    }

    if (!foundKey) {
      await logAudit(null, AuditAction.UNAUTHORIZED_ACCESS_ATTEMPT, 'API_KEY', null, {
        status: 'FAILURE',
        ipAddress,
        details: { reason: 'Invalid API key' },
      });
      return { valid: false, message: 'Invalid API key' };
    }

    if (revokedKeys.has(foundKey.id)) {
      await logAudit(null, AuditAction.UNAUTHORIZED_ACCESS_ATTEMPT, 'API_KEY', foundKey.id, {
        status: 'FAILURE',
        ipAddress,
        details: { reason: 'Key revoked' },
      });
      return { valid: false, message: 'API key has been revoked' };
    }

    if (!foundKey.isActive) {
      return { valid: false, message: 'API key is inactive' };
    }

    if (foundKey.expiresAt && foundKey.expiresAt < new Date()) {
      return { valid: false, message: 'API key has expired' };
    }

    return { valid: true, key: foundKey };
  }

  /**
   * Check rate limit
   */
  static async checkRateLimit(keyId: string): Promise<{ allowed: boolean; remaining: number }> {
    const key = apiKeys.get(keyId);

    if (!key) {
      return { allowed: false, remaining: 0 };
    }

    let usage = keyUsage.get(keyId);
    const now = new Date();

    if (!usage || usage.resetAt < now) {
      usage = {
        keyId,
        requestCount: 0,
        resetAt: new Date(Date.now() + 3600 * 1000),
      };
      keyUsage.set(keyId, usage);
    }

    usage.requestCount++;
    const remaining = Math.max(0, key.rateLimit - usage.requestCount);

    return {
      allowed: usage.requestCount <= key.rateLimit,
      remaining,
    };
  }

  /**
   * Check if key has required scope
   */
  static async hasScope(keyId: string, requiredScope: string): Promise<boolean> {
    const key = apiKeys.get(keyId);

    if (!key) {
      return false;
    }

    return key.scopes.includes(requiredScope);
  }

  /**
   * Revoke API key
   */
  static async revokeAPIKey(keyId: string, userId: string): Promise<void> {
    const key = apiKeys.get(keyId);

    if (!key) {
      throw new Error('API key not found');
    }

    revokedKeys.add(keyId);
    key.isActive = false;

    await logAudit(userId, AuditAction.USER_DEACTIVATED, 'API_KEY', keyId, {
      status: 'SUCCESS',
    });
  }

  /**
   * Get API key details (masked)
   */
  static async getAPIKey(
    keyId: string
  ): Promise<{ id: string; name: string; keyPrefix: string; scopes: string[]; rateLimit: number; isActive: boolean; createdAt: Date; expiresAt?: Date } | null> {
    const key = apiKeys.get(keyId);

    if (!key) {
      return null;
    }

    return {
      id: key.id,
      name: key.name,
      keyPrefix: `${key.keyPrefix}***`,
      scopes: key.scopes,
      rateLimit: key.rateLimit,
      isActive: key.isActive,
      createdAt: key.createdAt,
      expiresAt: key.expiresAt,
    };
  }

  /**
   * List API keys for app (masked)
   */
  static async listAPIKeys(organizationId: string, appId: string): Promise<Array<any>> {
    return Array.from(apiKeys.values())
      .filter((key) => key.organizationId === organizationId && key.appId === appId)
      .map((key) => ({
        id: key.id,
        name: key.name,
        keyPrefix: `${key.keyPrefix}***`,
        scopes: key.scopes,
        rateLimit: key.rateLimit,
        isActive: key.isActive,
        createdAt: key.createdAt,
        expiresAt: key.expiresAt,
        lastUsed: key.lastUsed,
      }));
  }

  /**
   * Update API key
   */
  static async updateAPIKey(
    keyId: string,
    updates: { name?: string; scopes?: string[]; rateLimit?: number }
  ): Promise<StoredAPIKey> {
    const key = apiKeys.get(keyId);

    if (!key) {
      throw new Error('API key not found');
    }

    if (updates.name) key.name = updates.name;
    if (updates.scopes) key.scopes = updates.scopes;
    if (updates.rateLimit) key.rateLimit = updates.rateLimit;

    return key;
  }

  /**
   * Record key usage
   */
  static async recordUsage(keyId: string): Promise<void> {
    const key = apiKeys.get(keyId);

    if (key) {
      key.lastUsed = new Date();
    }
  }

  /**
   * Hash API key for storage
   */
  private static hashKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  /**
   * Clean up expired keys
   */
  static async cleanupExpiredKeys(): Promise<void> {
    const now = new Date();

    for (const [keyId, key] of apiKeys.entries()) {
      if (key.expiresAt && key.expiresAt < now && key.isActive) {
        key.isActive = false;
      }
    }
  }
}
