/**
 * Rate Limiting Middleware
 *
 * Prevents abuse by limiting API requests
 * Uses in-memory storage (upgrade to Redis in production)
 */

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message?: string;
  retryAfter?: boolean;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

/**
 * In-memory store for rate limits
 * In production, use Redis or similar
 */
const rateLimitStore = new Map<
  string,
  { count: number; resetTime: number }
>();

/**
 * Default rate limit configs
 */
export const RateLimitPresets = {
  // General API
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  },

  // Authentication endpoints (stricter)
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
  },

  // Login attempts
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
  },

  // Password reset
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
  },

  // File upload
  fileUpload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
  },

  // Email sending
  email: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5,
  },

  // Appointment booking
  appointmentBooking: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
  },

  // Strict (high-risk operations)
  strict: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
  },

  // Generous (public endpoints)
  public: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 500,
  },
};

/**
 * Check rate limit for a key
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  // Initialize or reset if window has passed
  if (!record || record.resetTime < now) {
    rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs });
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    };
  }

  // Check if limit exceeded
  if (record.count >= config.maxRequests) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return {
      success: false,
      remaining: 0,
      resetTime: record.resetTime,
      retryAfter,
    };
  }

  // Increment count
  record.count++;
  return {
    success: true,
    remaining: config.maxRequests - record.count,
    resetTime: record.resetTime,
  };
}

/**
 * Rate limit by IP address
 */
export function checkRateLimitByIP(
  ip: string | null,
  config: RateLimitConfig
): RateLimitResult {
  const key = `ip:${ip || 'unknown'}`;
  return checkRateLimit(key, config);
}

/**
 * Rate limit by user ID
 */
export function checkRateLimitByUser(
  userId: string,
  config: RateLimitConfig
): RateLimitResult {
  const key = `user:${userId}`;
  return checkRateLimit(key, config);
}

/**
 * Rate limit by API key
 */
export function checkRateLimitByApiKey(
  apiKey: string,
  config: RateLimitConfig
): RateLimitResult {
  const key = `api:${apiKey}`;
  return checkRateLimit(key, config);
}

/**
 * Composite rate limit (IP + User)
 */
export function checkCompositeRateLimit(
  userId: string | null,
  ip: string | null,
  config: RateLimitConfig
): RateLimitResult {
  // Check user limit first (stricter)
  if (userId) {
    const userLimit = checkRateLimitByUser(userId, config);
    if (!userLimit.success) return userLimit;
  }

  // Then check IP limit
  return checkRateLimitByIP(ip, {
    ...config,
    maxRequests: config.maxRequests * 3, // More lenient for IP
  });
}

/**
 * Reset rate limit for a key
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

/**
 * Reset all rate limits
 */
export function resetAllRateLimits(): void {
  rateLimitStore.clear();
}

/**
 * Get current rate limit status
 */
export function getRateLimitStatus(key: string): {
  count: number;
  resetTime: number;
  remainingTime: number;
} | null {
  const record = rateLimitStore.get(key);
  if (!record) return null;

  return {
    count: record.count,
    resetTime: record.resetTime,
    remainingTime: Math.max(0, record.resetTime - Date.now()),
  };
}

/**
 * Cleanup expired rate limit records (call periodically)
 */
export function cleanupExpiredRateLimits(): number {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetTime < now) {
      rateLimitStore.delete(key);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`[RATE LIMIT] Cleaned up ${cleaned} expired records`);
  }

  return cleaned;
}

/**
 * Set up cleanup interval (run every hour)
 */
export function startRateLimitCleanup(intervalMs: number = 60 * 60 * 1000): NodeJS.Timer {
  return setInterval(() => {
    cleanupExpiredRateLimits();
  }, intervalMs);
}

/**
 * Get rate limit stats
 */
export function getRateLimitStats(): {
  totalKeys: number;
  activeKeys: number;
  expiredKeys: number;
} {
  const now = Date.now();
  let active = 0;
  let expired = 0;

  for (const record of rateLimitStore.values()) {
    if (record.resetTime < now) {
      expired++;
    } else {
      active++;
    }
  }

  return {
    totalKeys: rateLimitStore.size,
    activeKeys: active,
    expiredKeys: expired,
  };
}
