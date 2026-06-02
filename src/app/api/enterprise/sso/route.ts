/**
 * Enterprise SSO API Routes
 *
 * POST /api/enterprise/sso
 * - action: saml-init - Initiate SAML flow
 * - action: saml-process - Process SAML response
 * - action: saml-configure - Configure SAML
 * - action: saml-test - Test SAML connection
 * - action: oidc-init - Initiate OIDC flow
 * - action: oidc-exchange - Exchange auth code
 * - action: oidc-configure - Configure OIDC
 * - action: oidc-test - Test OIDC connection
 *
 * GET /api/enterprise/sso
 * - action: saml-config - Get SAML config
 * - action: oidc-config - Get OIDC config
 */

import { NextRequest, NextResponse } from 'next/server';
import { SAMLProvider } from '@/lib/enterprise/sso/samlProvider';
import { OIDCProvider } from '@/lib/enterprise/sso/oidcProvider';
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
    const { action, organizationId, redirectUri, code, state, samlResponse, config } = body;

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Missing organizationId' },
        { status: 400, headers: securityHeaders() }
      );
    }

    if (action === 'saml-init') {
      const request = await SAMLProvider.initiateSAMLRequest(organizationId);
      return NextResponse.json(
        { success: true, data: request },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'saml-process') {
      if (!samlResponse) {
        return NextResponse.json(
          { success: false, error: 'Missing samlResponse' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const response = await SAMLProvider.processSAMLResponse(organizationId, samlResponse);
      return NextResponse.json(
        { success: true, data: response },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'saml-configure') {
      if (!config) {
        return NextResponse.json(
          { success: false, error: 'Missing config' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const samlConfig = await SAMLProvider.configureSAML(organizationId, config);
      return NextResponse.json(
        { success: true, data: samlConfig },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'saml-test') {
      const result = await SAMLProvider.testSAMLConnection(organizationId);
      return NextResponse.json(
        { success: result.success, data: result },
        { status: result.success ? 200 : 400, headers: securityHeaders() }
      );
    } else if (action === 'oidc-init') {
      if (!redirectUri) {
        return NextResponse.json(
          { success: false, error: 'Missing redirectUri' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const result = await OIDCProvider.initializeOIDCFlow(organizationId, redirectUri);
      return NextResponse.json(
        { success: true, data: result },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'oidc-exchange') {
      if (!code || !state) {
        return NextResponse.json(
          { success: false, error: 'Missing code or state' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const tokens = await OIDCProvider.exchangeAuthorizationCode(organizationId, code, state);
      return NextResponse.json(
        { success: true, data: tokens },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'oidc-configure') {
      if (!config) {
        return NextResponse.json(
          { success: false, error: 'Missing config' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const oidcConfig = await OIDCProvider.configureOIDC(organizationId, config);
      return NextResponse.json(
        { success: true, data: oidcConfig },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'oidc-test') {
      const result = await OIDCProvider.testOIDCConnection(organizationId);
      return NextResponse.json(
        { success: result.success, data: result },
        { status: result.success ? 200 : 400, headers: securityHeaders() }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400, headers: securityHeaders() }
      );
    }
  } catch (error) {
    console.error('Error in POST /api/enterprise/sso:', error);
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
    const organizationId = req.nextUrl.searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Missing organizationId' },
        { status: 400, headers: securityHeaders() }
      );
    }

    if (action === 'saml-config') {
      const config = await SAMLProvider.getSAMLConfig(organizationId);
      return NextResponse.json(
        { success: true, data: config },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'oidc-config') {
      const config = await OIDCProvider.getOIDCConfig(organizationId);
      return NextResponse.json(
        { success: true, data: config },
        { status: 200, headers: securityHeaders() }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400, headers: securityHeaders() }
      );
    }
  } catch (error) {
    console.error('Error in GET /api/enterprise/sso:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}
