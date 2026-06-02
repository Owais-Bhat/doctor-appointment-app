/**
 * Enterprise Security API Routes
 *
 * POST /api/enterprise/security
 * - action: mfa-enable - Enable MFA for user
 * - action: mfa-verify-totp - Verify TOTP code
 * - action: mfa-verify-backup - Verify backup code
 * - action: passwordless-init - Initiate passwordless login
 * - action: passwordless-verify - Verify passwordless token
 * - action: record-login - Record login attempt
 * - action: mfa-disable - Disable MFA
 *
 * GET /api/enterprise/security
 * - action: mfa-config - Get MFA configuration
 * - action: anomalies - Detect anomalies
 * - action: status - Get security status
 * - action: device-validate - Validate device
 */

import { NextRequest, NextResponse } from 'next/server';
import { AdvancedAuthService } from '@/lib/enterprise/advancedAuth';
import { IPWhitelistingService } from '@/lib/enterprise/security/ipWhitelisting';
import { rateLimit } from '@/lib/middleware/rateLimiter';
import { securityHeaders } from '@/lib/middleware/securityHeaders';

export async function POST(req: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(req, 'enterprise');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429, headers: securityHeaders() }
      );
    }

    const body = await req.json();
    const { action, userId, organizationId, methods, code, sessionId, token, email, ipAddress, userAgent } =
      body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Missing userId' },
        { status: 400, headers: securityHeaders() }
      );
    }

    if (action === 'mfa-enable') {
      if (!organizationId || !methods || methods.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Missing organizationId or methods' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const config = await AdvancedAuthService.enableMFA(userId, organizationId, methods);

      return NextResponse.json(
        { success: true, data: config },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'mfa-verify-totp') {
      if (!code) {
        return NextResponse.json(
          { success: false, error: 'Missing code' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const verified = await AdvancedAuthService.verifyTOTP(userId, code);

      return NextResponse.json(
        { success: verified, verified },
        { status: verified ? 200 : 401, headers: securityHeaders() }
      );
    } else if (action === 'mfa-verify-backup') {
      if (!code) {
        return NextResponse.json(
          { success: false, error: 'Missing code' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const verified = await AdvancedAuthService.verifyBackupCode(userId, code);

      return NextResponse.json(
        { success: verified, verified },
        { status: verified ? 200 : 401, headers: securityHeaders() }
      );
    } else if (action === 'passwordless-init') {
      if (!organizationId || !email) {
        return NextResponse.json(
          { success: false, error: 'Missing organizationId or email' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const session = await AdvancedAuthService.initPasswordless(userId, organizationId, email);

      return NextResponse.json(
        { success: true, data: session },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'passwordless-verify') {
      if (!sessionId || !token) {
        return NextResponse.json(
          { success: false, error: 'Missing sessionId or token' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const verified = await AdvancedAuthService.verifyPasswordlessToken(sessionId, token);

      return NextResponse.json(
        { success: verified, verified },
        { status: verified ? 200 : 401, headers: securityHeaders() }
      );
    } else if (action === 'record-login') {
      if (!ipAddress || !userAgent) {
        return NextResponse.json(
          { success: false, error: 'Missing ipAddress or userAgent' },
          { status: 400, headers: securityHeaders() }
        );
      }

      await AdvancedAuthService.recordLogin(userId, ipAddress, userAgent);

      return NextResponse.json(
        { success: true, message: 'Login recorded' },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'mfa-disable') {
      await AdvancedAuthService.disableMFA(userId);

      return NextResponse.json(
        { success: true, message: 'MFA disabled' },
        { status: 200, headers: securityHeaders() }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400, headers: securityHeaders() }
      );
    }
  } catch (error) {
    console.error('Error in POST /api/enterprise/security:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(req, 'enterprise');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429, headers: securityHeaders() }
      );
    }

    const action = req.nextUrl.searchParams.get('action');
    const userId = req.nextUrl.searchParams.get('userId');
    const organizationId = req.nextUrl.searchParams.get('organizationId');
    const userAgent = req.nextUrl.searchParams.get('userAgent');
    const ipAddress = req.nextUrl.searchParams.get('ipAddress');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Missing userId' },
        { status: 400, headers: securityHeaders() }
      );
    }

    if (action === 'mfa-config') {
      const config = await AdvancedAuthService.getMFAConfig(userId);

      return NextResponse.json(
        { success: true, data: config },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'anomalies') {
      const anomalies = await AdvancedAuthService.detectAnomalies(userId);

      return NextResponse.json(
        { success: true, data: anomalies },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'status') {
      const status = await AdvancedAuthService.getSecurityStatus(userId);

      return NextResponse.json(
        { success: true, data: status },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'device-validate') {
      if (!userAgent || !ipAddress) {
        return NextResponse.json(
          { success: false, error: 'Missing userAgent or ipAddress' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const validation = await AdvancedAuthService.validateDeviceFingerprint(userId, userAgent, ipAddress);

      return NextResponse.json(
        { success: validation.valid, data: validation },
        { status: validation.valid ? 200 : 401, headers: securityHeaders() }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400, headers: securityHeaders() }
      );
    }
  } catch (error) {
    console.error('Error in GET /api/enterprise/security:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}
