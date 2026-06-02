/**
 * Internationalization API Routes
 *
 * GET /api/i18n
 * - action: languages - Get all supported languages
 * - action: language - Get current language
 * - action: translations - Get translations for language
 * - action: resources - Get health resources for region
 * - action: guidelines - Get medical guidelines for region
 * - action: medication - Get medication names for region
 *
 * POST /api/i18n
 * - action: set-language - Set preferred language
 * - action: detect-language - Detect browser language
 */

import { NextRequest, NextResponse } from 'next/server';
import { I18nService } from '@/lib/i18n/i18nService';
import { RegionalContentService } from '@/lib/i18n/regionalContentService';
import { LocalizationService } from '@/lib/i18n/localizationService';
import { rateLimit } from '@/lib/middleware/rateLimiter';
import { securityHeaders } from '@/lib/middleware/securityHeaders';

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
    const language = req.nextUrl.searchParams.get('language');
    const region = req.nextUrl.searchParams.get('region');
    const key = req.nextUrl.searchParams.get('key');

    if (action === 'languages') {
      const languages = I18nService.getSupportedLanguages();
      return NextResponse.json(
        { success: true, data: { languages } },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'language') {
      const currentLanguage = I18nService.getLanguage();
      const config = I18nService.getLanguageConfig();

      return NextResponse.json(
        { success: true, data: { language: currentLanguage, config } },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'translations') {
      if (!language) {
        return NextResponse.json(
          { success: false, error: 'Missing language parameter' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const translation = I18nService.translate(key || 'common.appName');

      return NextResponse.json(
        { success: true, data: { language, translation } },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'resources') {
      if (!region) {
        return NextResponse.json(
          { success: false, error: 'Missing region parameter' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const resources = RegionalContentService.getHealthResources(
        region as any,
        language || undefined
      );

      return NextResponse.json(
        { success: true, data: { region, resources } },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'guidelines') {
      if (!region) {
        return NextResponse.json(
          { success: false, error: 'Missing region parameter' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const guidelines = RegionalContentService.getMedicalGuidelines(region as any);

      return NextResponse.json(
        { success: true, data: { region, guidelines } },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'medication') {
      if (!region || !key) {
        return NextResponse.json(
          { success: false, error: 'Missing region or medication name' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const medicationName = RegionalContentService.getMedicationName(key, region as any);

      return NextResponse.json(
        { success: true, data: { generic: key, regional: medicationName, region } },
        { status: 200, headers: securityHeaders() }
      );
    } else if (!action) {
      return NextResponse.json(
        { success: true, message: 'i18n API v1' },
        { status: 200, headers: securityHeaders() }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400, headers: securityHeaders() }
      );
    }
  } catch (error) {
    console.error('Error in GET /api/i18n:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const rateLimitResult = await rateLimit(req, 'general');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429, headers: securityHeaders() }
      );
    }

    const body = await req.json();
    const { action } = body;

    if (action === 'set-language') {
      const { language } = body;

      if (!language) {
        return NextResponse.json(
          { success: false, error: 'Missing language parameter' },
          { status: 400, headers: securityHeaders() }
        );
      }

      I18nService.setLanguage(language);
      I18nService.saveToBrowser();

      return NextResponse.json(
        { success: true, message: `Language set to ${language}` },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'detect-language') {
      const detected = I18nService.getLanguage();
      const config = I18nService.getLanguageConfig();

      return NextResponse.json(
        { success: true, data: { detectedLanguage: detected, config } },
        { status: 200, headers: securityHeaders() }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400, headers: securityHeaders() }
      );
    }
  } catch (error) {
    console.error('Error in POST /api/i18n:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}
