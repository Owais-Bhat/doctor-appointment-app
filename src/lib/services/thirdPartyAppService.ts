/**
 * Third-Party App Service
 *
 * Manages third-party application registration and OAuth configuration
 * Handles app credentials, redirect URIs, and scope management
 */

import { ThirdPartyApp, OAuthScopeSchema } from '@/lib/validations';
import { logAudit, AuditAction } from '@/lib/audit/logger';
import crypto from 'crypto';

interface StoredApp {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  clientId: string;
  clientSecret: string;
  redirectUris: string[];
  scopes: string[];
  logoUrl?: string;
  websiteUrl: string;
  contactEmail: string;
  isActive: boolean;
  rateLimit: number;
  createdAt: Date;
  updatedAt: Date;
}

const apps = new Map<string, StoredApp>();
const clientIdMap = new Map<string, string>();

export class ThirdPartyAppService {
  /**
   * Register new third-party application
   */
  static async registerApp(
    organizationId: string,
    name: string,
    websiteUrl: string,
    contactEmail: string,
    redirectUris: string[],
    scopes: string[],
    description?: string,
    logoUrl?: string
  ): Promise<{ app: StoredApp; clientSecret: string }> {
    const appId = `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const clientId = this.generateClientId();
    const clientSecret = this.generateClientSecret();

    const app: StoredApp = {
      id: appId,
      name,
      description,
      organizationId,
      clientId,
      clientSecret,
      redirectUris,
      scopes,
      logoUrl,
      websiteUrl,
      contactEmail,
      isActive: true,
      rateLimit: 1000,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    apps.set(appId, app);
    clientIdMap.set(clientId, appId);

    await logAudit(organizationId, AuditAction.USER_CREATED, 'THIRD_PARTY_APP', appId, {
      status: 'SUCCESS',
      details: { name, scopes },
    });

    return {
      app,
      clientSecret,
    };
  }

  /**
   * Get app by ID
   */
  static async getAppById(appId: string): Promise<StoredApp | null> {
    return apps.get(appId) || null;
  }

  /**
   * Get app by client ID
   */
  static async getAppByClientId(clientId: string): Promise<StoredApp | null> {
    const appId = clientIdMap.get(clientId);
    return appId ? apps.get(appId) || null : null;
  }

  /**
   * List organization apps
   */
  static async listOrganizationApps(organizationId: string): Promise<StoredApp[]> {
    return Array.from(apps.values()).filter((app) => app.organizationId === organizationId);
  }

  /**
   * Validate redirect URI
   */
  static async validateRedirectUri(appId: string, redirectUri: string): Promise<boolean> {
    const app = apps.get(appId);

    if (!app) {
      return false;
    }

    return app.redirectUris.includes(redirectUri);
  }

  /**
   * Validate client credentials
   */
  static async validateClientCredentials(
    clientId: string,
    clientSecret: string
  ): Promise<{ valid: boolean; app?: StoredApp }> {
    const app = await this.getAppByClientId(clientId);

    if (!app) {
      return { valid: false };
    }

    if (app.clientSecret !== clientSecret) {
      return { valid: false };
    }

    if (!app.isActive) {
      return { valid: false };
    }

    return { valid: true, app };
  }

  /**
   * Update app
   */
  static async updateApp(
    appId: string,
    updates: Partial<{
      name: string;
      description: string;
      logoUrl: string;
      websiteUrl: string;
      contactEmail: string;
      redirectUris: string[];
      scopes: string[];
      rateLimit: number;
    }>,
    userId: string
  ): Promise<StoredApp> {
    const app = apps.get(appId);

    if (!app) {
      throw new Error('App not found');
    }

    Object.assign(app, updates, { updatedAt: new Date() });

    await logAudit(userId, AuditAction.USER_UPDATED, 'THIRD_PARTY_APP', appId, {
      status: 'SUCCESS',
      details: { updates },
    });

    return app;
  }

  /**
   * Regenerate client secret
   */
  static async regenerateClientSecret(appId: string, userId: string): Promise<string> {
    const app = apps.get(appId);

    if (!app) {
      throw new Error('App not found');
    }

    const newSecret = this.generateClientSecret();
    app.clientSecret = newSecret;
    app.updatedAt = new Date();

    await logAudit(userId, AuditAction.PASSWORD_CHANGE, 'THIRD_PARTY_APP', appId, {
      status: 'SUCCESS',
    });

    return newSecret;
  }

  /**
   * Deactivate app
   */
  static async deactivateApp(appId: string, userId: string): Promise<void> {
    const app = apps.get(appId);

    if (!app) {
      throw new Error('App not found');
    }

    app.isActive = false;
    app.updatedAt = new Date();

    await logAudit(userId, AuditAction.USER_DEACTIVATED, 'THIRD_PARTY_APP', appId, {
      status: 'SUCCESS',
    });
  }

  /**
   * Delete app
   */
  static async deleteApp(appId: string, userId: string): Promise<void> {
    const app = apps.get(appId);

    if (!app) {
      throw new Error('App not found');
    }

    clientIdMap.delete(app.clientId);
    apps.delete(appId);

    await logAudit(userId, AuditAction.USER_DEACTIVATED, 'THIRD_PARTY_APP', appId, {
      status: 'SUCCESS',
      details: { deleted: true },
    });
  }

  /**
   * Verify scope access
   */
  static async verifyScope(appId: string, requiredScope: string): Promise<boolean> {
    const app = apps.get(appId);

    if (!app || !app.isActive) {
      return false;
    }

    return app.scopes.includes(requiredScope);
  }

  /**
   * Add redirect URI
   */
  static async addRedirectUri(appId: string, redirectUri: string): Promise<void> {
    const app = apps.get(appId);

    if (!app) {
      throw new Error('App not found');
    }

    if (!app.redirectUris.includes(redirectUri)) {
      app.redirectUris.push(redirectUri);
      app.updatedAt = new Date();
    }
  }

  /**
   * Remove redirect URI
   */
  static async removeRedirectUri(appId: string, redirectUri: string): Promise<void> {
    const app = apps.get(appId);

    if (!app) {
      throw new Error('App not found');
    }

    app.redirectUris = app.redirectUris.filter((uri) => uri !== redirectUri);
    app.updatedAt = new Date();
  }

  /**
   * Generate client ID
   */
  private static generateClientId(): string {
    return `client_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`;
  }

  /**
   * Generate client secret
   */
  private static generateClientSecret(): string {
    return `secret_${Date.now()}_${crypto.randomBytes(32).toString('hex')}`;
  }
}
