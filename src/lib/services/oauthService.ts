/**
 * OAuth 2.0 Service
 *
 * Handles OAuth 2.0 authorization code flow for third-party apps
 * Manages access tokens, refresh tokens, and authorization scopes
 */

import { OAuthToken, OAuthScopeSchema } from '@/lib/validations';
import { logAudit, AuditAction } from '@/lib/audit/logger';

interface OAuthAuthorizationRequest {
  clientId: string;
  redirectUri: string;
  scope: string;
  state: string;
  responseType: 'code';
}

interface OAuthTokenRequest {
  grantType: 'authorization_code' | 'refresh_token';
  clientId: string;
  clientSecret: string;
  code?: string;
  refreshToken?: string;
  redirectUri?: string;
}

interface OAuthAuthorizationCode {
  code: string;
  clientId: string;
  userId: string;
  scopes: string[];
  redirectUri: string;
  expiresAt: Date;
  state: string;
}

interface StoredToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  scopes: string[];
  userId: string;
  clientId: string;
}

const authorizationCodes = new Map<string, OAuthAuthorizationCode>();
const tokens = new Map<string, StoredToken>();
const tokenBlacklist = new Set<string>();

export class OAuthService {
  /**
   * Generate authorization code for OAuth flow
   */
  static async generateAuthorizationCode(
    clientId: string,
    userId: string,
    scopes: string[],
    redirectUri: string,
    state: string
  ): Promise<string> {
    const code = this.generateRandomCode(32);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    authorizationCodes.set(code, {
      code,
      clientId,
      userId,
      scopes,
      redirectUri,
      expiresAt,
      state,
    });

    await logAudit(userId, AuditAction.LOGIN, 'OAUTH_CODE', code, {
      details: { clientId, scopes },
    });

    return code;
  }

  /**
   * Exchange authorization code for tokens
   */
  static async exchangeCodeForToken(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string,
    ipAddress?: string | null
  ): Promise<OAuthToken> {
    const authCode = authorizationCodes.get(code);

    if (!authCode) {
      await logAudit(null, AuditAction.SECURITY_BREACH_ATTEMPT, 'OAUTH', code, {
        status: 'FAILURE',
        ipAddress,
        details: { reason: 'Invalid code' },
      });
      throw new Error('Invalid authorization code');
    }

    if (authCode.expiresAt < new Date()) {
      authorizationCodes.delete(code);
      throw new Error('Authorization code expired');
    }

    if (authCode.clientId !== clientId) {
      throw new Error('Client ID mismatch');
    }

    if (authCode.redirectUri !== redirectUri) {
      throw new Error('Redirect URI mismatch');
    }

    // Validate clientSecret would happen here with app lookup
    // For now, assuming validation passed

    const accessToken = this.generateRandomCode(64);
    const refreshToken = this.generateRandomCode(64);
    const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour

    tokens.set(accessToken, {
      accessToken,
      refreshToken,
      expiresAt,
      scopes: authCode.scopes,
      userId: authCode.userId,
      clientId: authCode.clientId,
    });

    authorizationCodes.delete(code);

    await logAudit(authCode.userId, AuditAction.LOGIN, 'OAUTH_TOKEN', clientId, {
      status: 'SUCCESS',
      details: { scopes: authCode.scopes },
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: 3600,
      refreshToken,
      scope: authCode.scopes.join(' '),
    };
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshAccessToken(
    refreshToken: string,
    clientId: string
  ): Promise<OAuthToken> {
    let accessToken: string | undefined;

    for (const [key, token] of tokens.entries()) {
      if (token.refreshToken === refreshToken && token.clientId === clientId) {
        accessToken = key;
        break;
      }
    }

    if (!accessToken) {
      throw new Error('Invalid refresh token');
    }

    const token = tokens.get(accessToken)!;
    tokens.delete(accessToken);
    tokenBlacklist.add(accessToken);

    const newAccessToken = this.generateRandomCode(64);
    const newRefreshToken = this.generateRandomCode(64);
    const expiresAt = new Date(Date.now() + 3600 * 1000);

    tokens.set(newAccessToken, {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresAt,
      scopes: token.scopes,
      userId: token.userId,
      clientId: token.clientId,
    });

    await logAudit(token.userId, AuditAction.LOGIN, 'OAUTH_REFRESH', clientId, {
      status: 'SUCCESS',
    });

    return {
      accessToken: newAccessToken,
      tokenType: 'Bearer',
      expiresIn: 3600,
      refreshToken: newRefreshToken,
      scope: token.scopes.join(' '),
    };
  }

  /**
   * Validate access token
   */
  static async validateToken(
    accessToken: string
  ): Promise<{ valid: boolean; userId?: string; scopes?: string[] }> {
    if (tokenBlacklist.has(accessToken)) {
      return { valid: false };
    }

    const token = tokens.get(accessToken);

    if (!token) {
      return { valid: false };
    }

    if (token.expiresAt < new Date()) {
      tokens.delete(accessToken);
      tokenBlacklist.add(accessToken);
      return { valid: false };
    }

    return {
      valid: true,
      userId: token.userId,
      scopes: token.scopes,
    };
  }

  /**
   * Check if token has required scope
   */
  static async hasScope(accessToken: string, requiredScope: string): Promise<boolean> {
    const validation = await this.validateToken(accessToken);

    if (!validation.valid || !validation.scopes) {
      return false;
    }

    return validation.scopes.includes(requiredScope);
  }

  /**
   * Revoke token
   */
  static async revokeToken(accessToken: string): Promise<void> {
    const token = tokens.get(accessToken);

    if (token) {
      await logAudit(token.userId, AuditAction.LOGOUT, 'OAUTH_TOKEN', token.clientId, {
        status: 'SUCCESS',
      });
    }

    tokens.delete(accessToken);
    tokenBlacklist.add(accessToken);
  }

  /**
   * Get user from token
   */
  static async getUserFromToken(accessToken: string) {
    const validation = await this.validateToken(accessToken);

    if (!validation.valid || !validation.userId) {
      return null;
    }

    return {
      userId: validation.userId,
      scopes: validation.scopes,
    };
  }

  /**
   * Generate random code/token
   */
  private static generateRandomCode(length: number): string {
    return `oauth_${Date.now()}_${Math.random().toString(36).substr(2, length)}`;
  }

  /**
   * Clean up expired codes and tokens
   */
  static async cleanupExpiredTokens(): Promise<void> {
    const now = new Date();

    for (const [code, authCode] of authorizationCodes.entries()) {
      if (authCode.expiresAt < now) {
        authorizationCodes.delete(code);
      }
    }

    for (const [token, storedToken] of tokens.entries()) {
      if (storedToken.expiresAt < now) {
        tokens.delete(token);
        tokenBlacklist.add(token);
      }
    }
  }
}
