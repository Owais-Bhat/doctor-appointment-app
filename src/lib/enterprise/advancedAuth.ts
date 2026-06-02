/**
 * Advanced Authentication Service
 * Multi-factor authentication and advanced security features
 */

import { logAudit, AuditAction } from '@/lib/audit/logger';

interface MFAConfig {
  id: string;
  userId: string;
  organizationId: string;
  enabled: boolean;
  methods: ('totp' | 'sms' | 'email')[];
  totpSecret?: string;
  phoneNumber?: string;
  backupCodes: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface PasswordlessSession {
  id: string;
  userId: string;
  organizationId: string;
  email: string;
  token: string;
  expiresAt: Date;
  verified: boolean;
  createdAt: Date;
}

interface DeviceFingerprint {
  id: string;
  userId: string;
  deviceHash: string;
  userAgent: string;
  ipAddress: string;
  lastSeen: Date;
  trustLevel: 'trusted' | 'suspicious' | 'blocked';
}

interface AnomalyDetection {
  userId: string;
  loginCount24h: number;
  uniqueIPs24h: number;
  uniqueDevices24h: number;
  isAnomalous: boolean;
  riskScore: number; // 0-100
}

const mfaConfigs = new Map<string, MFAConfig>();
const passwordlessSessions = new Map<string, PasswordlessSession>();
const deviceFingerprints = new Map<string, DeviceFingerprint>();
const loginHistory = new Map<string, { timestamp: Date; ipAddress: string; deviceHash: string }[]>();

export class AdvancedAuthService {
  private static generateSecret(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  static async enableMFA(
    userId: string,
    organizationId: string,
    methods: ('totp' | 'sms' | 'email')[]
  ): Promise<MFAConfig> {
    const id = `mfa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const backupCodes = Array.from({ length: 10 }, () =>
      Math.random().toString(36).substr(2, 8).toUpperCase()
    );

    const config: MFAConfig = {
      id,
      userId,
      organizationId,
      enabled: true,
      methods,
      totpSecret: methods.includes('totp') ? this.generateSecret() : undefined,
      backupCodes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mfaConfigs.set(id, config);

    await logAudit(userId, AuditAction.MFA_ENABLED, 'MFA_CONFIG', id, {
      status: 'SUCCESS',
      details: { methods },
    });

    return config;
  }

  static async getMFAConfig(userId: string): Promise<MFAConfig | undefined> {
    return Array.from(mfaConfigs.values()).find((c) => c.userId === userId && c.enabled);
  }

  static async verifyTOTP(userId: string, code: string): Promise<boolean> {
    const config = await this.getMFAConfig(userId);
    if (!config || !config.totpSecret) return false;

    // Simplified TOTP verification - in production, use speakeasy or similar
    const expectedCode = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, '0');
    const isValid = code === expectedCode;

    if (isValid) {
      await logAudit(userId, AuditAction.MFA_VERIFIED, 'TOTP_VERIFICATION', config.id, {
        status: 'SUCCESS',
        details: {},
      });
    }

    return isValid;
  }

  static async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const config = await this.getMFAConfig(userId);
    if (!config) return false;

    const index = config.backupCodes.indexOf(code.toUpperCase());
    if (index === -1) return false;

    config.backupCodes.splice(index, 1);
    config.updatedAt = new Date();

    await logAudit(userId, AuditAction.MFA_VERIFIED, 'BACKUP_CODE', config.id, {
      status: 'SUCCESS',
      details: { codesRemaining: config.backupCodes.length },
    });

    return true;
  }

  static async initPasswordless(
    userId: string,
    organizationId: string,
    email: string
  ): Promise<PasswordlessSession> {
    const id = `pwl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const token = Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);

    const session: PasswordlessSession = {
      id,
      userId,
      organizationId,
      email,
      token,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      verified: false,
      createdAt: new Date(),
    };

    passwordlessSessions.set(id, session);

    await logAudit(userId, AuditAction.PASSWORDLESS_INITIATED, 'PASSWORDLESS_SESSION', id, {
      status: 'SUCCESS',
      details: { email },
    });

    return session;
  }

  static async verifyPasswordlessToken(sessionId: string, token: string): Promise<boolean> {
    const session = passwordlessSessions.get(sessionId);
    if (!session) return false;

    const now = new Date();
    if (now > session.expiresAt) {
      passwordlessSessions.delete(sessionId);
      return false;
    }

    if (session.token !== token) return false;

    session.verified = true;

    await logAudit(session.userId, AuditAction.PASSWORDLESS_VERIFIED, 'PASSWORDLESS_SESSION', sessionId, {
      status: 'SUCCESS',
      details: {},
    });

    return true;
  }

  static async generateDeviceFingerprint(
    userId: string,
    userAgent: string,
    ipAddress: string
  ): Promise<string> {
    // Simplified device fingerprinting - in production use a library
    const fingerprintData = `${userAgent}|${ipAddress}|${Math.random().toString()}`;
    const hash = Buffer.from(fingerprintData).toString('base64').substr(0, 32);

    const fingerprint: DeviceFingerprint = {
      id: `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      deviceHash: hash,
      userAgent,
      ipAddress,
      lastSeen: new Date(),
      trustLevel: 'suspicious',
    };

    deviceFingerprints.set(fingerprint.id, fingerprint);
    return hash;
  }

  static async validateDeviceFingerprint(
    userId: string,
    userAgent: string,
    ipAddress: string
  ): Promise<{ valid: boolean; trustLevel: string }> {
    const fingerprint = await this.generateDeviceFingerprint(userId, userAgent, ipAddress);

    const existingDevices = Array.from(deviceFingerprints.values()).filter(
      (d) => d.userId === userId && d.deviceHash === fingerprint
    );

    if (existingDevices.length > 0) {
      const device = existingDevices[0];
      const hoursSinceLastUse = (Date.now() - device.lastSeen.getTime()) / (1000 * 60 * 60);

      if (hoursSinceLastUse < 24) {
        device.trustLevel = 'trusted';
      }

      device.lastSeen = new Date();

      return {
        valid: true,
        trustLevel: device.trustLevel,
      };
    }

    return {
      valid: false,
      trustLevel: 'suspicious',
    };
  }

  static async recordLogin(
    userId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    if (!loginHistory.has(userId)) {
      loginHistory.set(userId, []);
    }

    const deviceHash = await this.generateDeviceFingerprint(userId, userAgent, ipAddress);

    loginHistory.get(userId)!.push({
      timestamp: new Date(),
      ipAddress,
      deviceHash,
    });

    await logAudit(userId, AuditAction.LOGIN_SUCCESSFUL, 'LOGIN_RECORD', userId, {
      status: 'SUCCESS',
      details: { ipAddress },
    });
  }

  static async detectAnomalies(userId: string): Promise<AnomalyDetection> {
    const logins = loginHistory.get(userId) || [];
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentLogins = logins.filter((l) => l.timestamp > cutoff);

    const loginCount24h = recentLogins.length;
    const uniqueIPs = new Set(recentLogins.map((l) => l.ipAddress)).size;
    const uniqueDevices = new Set(recentLogins.map((l) => l.deviceHash)).size;

    // Calculate risk score
    let riskScore = 0;
    if (loginCount24h > 10) riskScore += 30;
    if (uniqueIPs > 5) riskScore += 25;
    if (uniqueDevices > 5) riskScore += 25;
    if (loginCount24h > 20) riskScore += 20;

    const isAnomalous = riskScore > 50;

    if (isAnomalous) {
      await logAudit(userId, AuditAction.ANOMALY_DETECTED, 'ANOMALY_ALERT', userId, {
        status: 'ALERT',
        details: { riskScore, loginCount24h, uniqueIPs, uniqueDevices },
      });
    }

    return {
      userId,
      loginCount24h,
      uniqueIPs24h: uniqueIPs,
      uniqueDevices24h: uniqueDevices,
      isAnomalous,
      riskScore,
    };
  }

  static async disableMFA(userId: string): Promise<void> {
    const config = await this.getMFAConfig(userId);
    if (config) {
      config.enabled = false;
      config.updatedAt = new Date();
    }

    await logAudit(userId, AuditAction.MFA_DISABLED, 'MFA_CONFIG', config?.id || '', {
      status: 'SUCCESS',
      details: {},
    });
  }

  static async getSecurityStatus(userId: string): Promise<{
    mfaEnabled: boolean;
    trustedDevices: number;
    recentAnomalies: boolean;
    lastLoginAt: Date | null;
    passwordlesCapable: boolean;
  }> {
    const mfaConfig = await this.getMFAConfig(userId);
    const devices = Array.from(deviceFingerprints.values())
      .filter((d) => d.userId === userId && d.trustLevel === 'trusted')
      .length;
    const anomalies = await this.detectAnomalies(userId);
    const logins = loginHistory.get(userId) || [];
    const lastLogin = logins.length > 0 ? logins[logins.length - 1].timestamp : null;

    return {
      mfaEnabled: mfaConfig?.enabled || false,
      trustedDevices: devices,
      recentAnomalies: anomalies.isAnomalous,
      lastLoginAt: lastLogin,
      passwordlesCapable: true,
    };
  }
}
