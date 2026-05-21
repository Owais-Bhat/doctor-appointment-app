/**
 * Security Headers Middleware
 *
 * Adds security headers to all responses
 * Protects against common web vulnerabilities
 */

export interface SecurityHeadersConfig {
  contentSecurityPolicy?: boolean;
  crossOriginEmbedderPolicy?: boolean;
  crossOriginOpenerPolicy?: boolean;
  crossOriginResourcePolicy?: boolean;
  dnsPrefetchControl?: boolean;
  frameGuard?: boolean;
  noSniff?: boolean;
  referrerPolicy?: boolean;
  strictTransportSecurity?: boolean;
  xssFilter?: boolean;
}

/**
 * Default secure headers configuration
 */
const defaultConfig: SecurityHeadersConfig = {
  contentSecurityPolicy: true,
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: true,
  dnsPrefetchControl: true,
  frameGuard: true,
  noSniff: true,
  referrerPolicy: true,
  strictTransportSecurity: true,
  xssFilter: true,
};

/**
 * Security headers for different environments
 */
export const SecurityHeadersPresets = {
  // Maximum security (production)
  strict: {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy':
      'geolocation=(), microphone=(), camera=(), payment=()',
    'Content-Security-Policy':
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https:; frame-ancestors 'none';",
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
  },

  // Balanced security (default)
  standard: {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy':
      'geolocation=(), microphone=(), camera=(), payment=()',
    'Content-Security-Policy':
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https:",
  },

  // Development (less restrictive)
  development: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  },
};

/**
 * Get security headers based on environment
 */
export function getSecurityHeaders(
  environment: 'production' | 'staging' | 'development' = 'production'
): Record<string, string> {
  if (environment === 'development') {
    return SecurityHeadersPresets.development;
  }
  if (environment === 'staging') {
    return SecurityHeadersPresets.standard;
  }
  return SecurityHeadersPresets.strict;
}

/**
 * Healthcare-specific security headers
 */
export const HealthcareSecurityHeaders = {
  // HIPAA compliance headers
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY', // Prevent clickjacking
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=()',

  // Content Security Policy (strict for healthcare)
  'Content-Security-Policy': `
    default-src 'self';
    script-src 'self';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    font-src 'self';
    connect-src 'self' https:;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
    upgrade-insecure-requests;
  `
    .replace(/\n/g, '')
    .trim(),

  // Additional healthcare security
  'X-Content-Security-Policy': 'nosniff',
  'X-Permitted-Cross-Domain-Policies': 'none',
  'Expect-CT': 'max-age=86400, enforce',

  // Privacy headers
  'X-HIPAA-Compliant': 'true',
  'X-Privacy-Compliant': 'true',
};

/**
 * Add security headers to response
 */
export function setSecurityHeaders(
  headers: Headers,
  environment: 'production' | 'staging' | 'development' = 'production',
  healthcare: boolean = true
): void {
  const securityHeaders = healthcare
    ? HealthcareSecurityHeaders
    : getSecurityHeaders(environment);

  for (const [key, value] of Object.entries(securityHeaders)) {
    headers.set(key, value);
  }

  // Additional headers for all responses
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  headers.set('Pragma', 'no-cache');
  headers.set('Expires', '0');
}

/**
 * CORS headers for healthcare API
 */
export const CORSHeaders = {
  allowedOrigins: [
    'http://localhost:3000', // Development
    process.env.NEXT_PUBLIC_APP_URL, // Production
  ].filter(Boolean),
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-API-Key',
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count', 'Retry-After'],
  credentials: true,
  maxAge: 86400, // 24 hours
};

/**
 * Set CORS headers
 */
export function setCORSHeaders(
  headers: Headers,
  origin: string | null
): void {
  if (!origin) return;

  const isAllowed = CORSHeaders.allowedOrigins.includes(origin);

  if (isAllowed) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set(
      'Access-Control-Allow-Methods',
      CORSHeaders.allowedMethods.join(', ')
    );
    headers.set(
      'Access-Control-Allow-Headers',
      CORSHeaders.allowedHeaders.join(', ')
    );
    headers.set(
      'Access-Control-Expose-Headers',
      CORSHeaders.exposedHeaders.join(', ')
    );
    headers.set(
      'Access-Control-Max-Age',
      CORSHeaders.maxAge.toString()
    );
    headers.set(
      'Access-Control-Allow-Credentials',
      'true'
    );
  }
}

/**
 * Type-safe CSP builder for custom headers
 */
export class CSPBuilder {
  private directives: Map<string, string[]> = new Map();

  constructor() {
    this.setDefaults();
  }

  private setDefaults(): void {
    this.addDirective('default-src', ["'self'"]);
    this.addDirective('base-uri', ["'self'"]);
    this.addDirective('form-action', ["'self'"]);
  }

  addDirective(directive: string, sources: string[]): this {
    this.directives.set(directive, sources);
    return this;
  }

  addSource(directive: string, source: string): this {
    const current = this.directives.get(directive) || [];
    if (!current.includes(source)) {
      current.push(source);
      this.directives.set(directive, current);
    }
    return this;
  }

  build(): string {
    return Array.from(this.directives.entries())
      .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
      .join('; ');
  }
}

/**
 * Example healthcare CSP
 */
export function buildHealthcareCSP(): string {
  return new CSPBuilder()
    .addDirective('script-src', ["'self'"]) // No inline scripts
    .addDirective('style-src', ["'self'"]) // No inline styles
    .addDirective('img-src', ["'self'", 'data:', 'https:'])
    .addDirective('font-src', ["'self'"])
    .addDirective('connect-src', ["'self'", 'https:'])
    .addDirective('frame-ancestors', ["'none'"]) // Prevent embedding
    .addDirective('upgrade-insecure-requests', [])
    .build();
}
