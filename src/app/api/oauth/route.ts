/**
 * OAuth 2.0 API Routes
 *
 * POST /api/oauth/authorize    - Get authorization code
 * POST /api/oauth/token        - Exchange code for token
 * POST /api/oauth/refresh      - Refresh access token
 * POST /api/oauth/revoke       - Revoke token
 */

import { NextRequest, NextResponse } from 'next/server';
import { OAuthService } from '@/lib/services/oauthService';
import { ThirdPartyAppService } from '@/lib/services/thirdPartyAppService';
import { rateLimit } from '@/lib/middleware/rateLimiter';
import { securityHeaders } from '@/lib/middleware/securityHeaders';

export async function POST(req: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(req, 'auth');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429, headers: securityHeaders() }
      );
    }

    const body = await req.json();
    const { action } = body;
    const ipAddress = req.headers.get('x-forwarded-for');

    switch (action) {
      case 'authorize': {
        const { clientId, redirectUri, scope, state } = body;

        if (!clientId || !redirectUri || !scope || !state) {
          return NextResponse.json(
            { success: false, error: 'Missing required parameters' },
            { status: 400, headers: securityHeaders() }
          );
        }

        const app = await ThirdPartyAppService.getAppByClientId(clientId);
        if (!app || !app.isActive) {
          return NextResponse.json(
            { success: false, error: 'Invalid client' },
            { status: 400, headers: securityHeaders() }
          );
        }

        const isValidRedirectUri = await ThirdPartyAppService.validateRedirectUri(app.id, redirectUri);
        if (!isValidRedirectUri) {
          return NextResponse.json(
            { success: false, error: 'Invalid redirect URI' },
            { status: 400, headers: securityHeaders() }
          );
        }

        const scopes = scope.split(' ');
        const code = await OAuthService.generateAuthorizationCode(
          clientId,
          'user_123', // TODO: Get from session
          scopes,
          redirectUri,
          state
        );

        const redirectUrl = new URL(redirectUri);
        redirectUrl.searchParams.set('code', code);
        redirectUrl.searchParams.set('state', state);

        return NextResponse.redirect(redirectUrl.toString());
      }

      case 'token': {
        const { code, clientId, clientSecret, redirectUri, grantType, refreshToken } = body;

        if (grantType === 'authorization_code') {
          if (!code || !clientId || !clientSecret || !redirectUri) {
            return NextResponse.json(
              { success: false, error: 'Missing required parameters' },
              { status: 400, headers: securityHeaders() }
            );
          }

          const credentials = await ThirdPartyAppService.validateClientCredentials(
            clientId,
            clientSecret
          );

          if (!credentials.valid) {
            return NextResponse.json(
              { success: false, error: 'Invalid credentials' },
              { status: 401, headers: securityHeaders() }
            );
          }

          const token = await OAuthService.exchangeCodeForToken(
            code,
            clientId,
            clientSecret,
            redirectUri,
            ipAddress
          );

          return NextResponse.json(token, {
            status: 200,
            headers: securityHeaders(),
          });
        } else if (grantType === 'refresh_token') {
          if (!refreshToken || !clientId) {
            return NextResponse.json(
              { success: false, error: 'Missing required parameters' },
              { status: 400, headers: securityHeaders() }
            );
          }

          const token = await OAuthService.refreshAccessToken(refreshToken, clientId);

          return NextResponse.json(token, {
            status: 200,
            headers: securityHeaders(),
          });
        }

        return NextResponse.json(
          { success: false, error: 'Invalid grant type' },
          { status: 400, headers: securityHeaders() }
        );
      }

      case 'revoke': {
        const { accessToken } = body;

        if (!accessToken) {
          return NextResponse.json(
            { success: false, error: 'Missing access token' },
            { status: 400, headers: securityHeaders() }
          );
        }

        await OAuthService.revokeToken(accessToken);

        return NextResponse.json(
          { success: true },
          { status: 200, headers: securityHeaders() }
        );
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400, headers: securityHeaders() }
        );
    }
  } catch (error) {
    console.error('Error in POST /api/oauth:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}
