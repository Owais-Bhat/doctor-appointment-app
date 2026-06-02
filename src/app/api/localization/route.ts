/**
 * Localization API Routes
 *
 * GET /api/localization
 * - action: format-date - Format date for locale
 * - action: format-time - Format time for locale
 * - action: format-datetime - Format date and time
 * - action: format-number - Format number for locale
 * - action: format-currency - Format currency for locale
 * - action: format-address - Format address for locale
 * - action: format-phone - Format phone number for locale
 * - action: timezone - Get timezone for locale
 * - action: config - Get locale configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { LocalizationService } from '@/lib/i18n/localizationService';
import { rateLimit } from '@/lib/middleware/rateLimiter';
import { securityHeaders } from '@/lib/middleware/securityHeaders';

type Locale = 'en-US' | 'es-ES' | 'fr-FR' | 'de-DE' | 'zh-CN' | 'pt-BR' | 'ja-JP' | 'ko-KR' | 'ru-RU' | 'ar-SA' | 'he-IL';

export async function GET(req: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(req, 'general');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429, headers: securityHeaders() }
      );
    }

    const action = req.nextUrl.searchParams.get('action');
    const locale = (req.nextUrl.searchParams.get('locale') || 'en-US') as Locale;
    const date = req.nextUrl.searchParams.get('date');
    const value = req.nextUrl.searchParams.get('value');
    const street = req.nextUrl.searchParams.get('street');
    const city = req.nextUrl.searchParams.get('city');
    const state = req.nextUrl.searchParams.get('state');
    const zip = req.nextUrl.searchParams.get('zip');
    const country = req.nextUrl.searchParams.get('country');
    const phone = req.nextUrl.searchParams.get('phone');

    if (action === 'format-date') {
      if (!date) {
        return NextResponse.json(
          { success: false, error: 'Missing date parameter' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const formatted = LocalizationService.formatDate(new Date(date), locale);

      return NextResponse.json(
        { success: true, data: { date, formatted, locale } },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'format-time') {
      if (!date) {
        return NextResponse.json(
          { success: false, error: 'Missing date parameter' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const formatted = LocalizationService.formatTime(new Date(date), locale);

      return NextResponse.json(
        { success: true, data: { date, formatted, locale } },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'format-datetime') {
      if (!date) {
        return NextResponse.json(
          { success: false, error: 'Missing date parameter' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const formatted = LocalizationService.formatDateTime(new Date(date), locale);

      return NextResponse.json(
        { success: true, data: { date, formatted, locale } },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'format-number') {
      if (!value) {
        return NextResponse.json(
          { success: false, error: 'Missing value parameter' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const formatted = LocalizationService.formatNumber(parseFloat(value), locale);

      return NextResponse.json(
        { success: true, data: { value: parseFloat(value), formatted, locale } },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'format-currency') {
      if (!value) {
        return NextResponse.json(
          { success: false, error: 'Missing value parameter' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const formatted = LocalizationService.formatCurrency(parseFloat(value), locale);

      return NextResponse.json(
        { success: true, data: { value: parseFloat(value), formatted, locale } },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'format-address') {
      if (!street || !city || !state || !zip || !country) {
        return NextResponse.json(
          { success: false, error: 'Missing address components' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const formatted = LocalizationService.formatAddress(street, city, state, zip, country, locale);

      return NextResponse.json(
        {
          success: true,
          data: { street, city, state, zip, country, formatted, locale },
        },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'format-phone') {
      if (!phone) {
        return NextResponse.json(
          { success: false, error: 'Missing phone parameter' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const formatted = LocalizationService.formatPhoneNumber(phone, locale);

      return NextResponse.json(
        { success: true, data: { phone, formatted, locale } },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'timezone') {
      const timezone = LocalizationService.getTimezone(locale);

      return NextResponse.json(
        { success: true, data: { locale, timezone } },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'config') {
      const config = LocalizationService.getConfig(locale);

      return NextResponse.json(
        { success: true, data: { locale, config } },
        { status: 200, headers: securityHeaders() }
      );
    } else if (!action) {
      const supportedLocales = LocalizationService.getSupportedLocales();

      return NextResponse.json(
        { success: true, data: { supportedLocales, defaultLocale: 'en-US' } },
        { status: 200, headers: securityHeaders() }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400, headers: securityHeaders() }
      );
    }
  } catch (error) {
    console.error('Error in GET /api/localization:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}
