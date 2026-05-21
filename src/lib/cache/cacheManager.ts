/**
 * Cache Manager
 *
 * Centralized caching layer for performance optimization
 * Supports multiple cache strategies and invalidation patterns
 */

/**
 * Cache entry with TTL
 */
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  tags: string[];
  createdAt: number;
}

/**
 * In-memory cache store
 * In production, use Redis or similar
 */
class CacheStore {
  private store: Map<string, CacheEntry<any>> = new Map();
  private tagIndex: Map<string, Set<string>> = new Map();

  /**
   * Set cache value
   */
  set<T>(key: string, value: T, ttl: number = 3600000, tags: string[] = []): void {
    const expiresAt = Date.now() + ttl;
    const entry: CacheEntry<T> = {
      value,
      expiresAt,
      tags,
      createdAt: Date.now(),
    };

    this.store.set(key, entry);

    // Index by tags for bulk invalidation
    for (const tag of tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(key);
    }
  }

  /**
   * Get cache value
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key);

    if (!entry) {
      return null;
    }

    // Check expiration
    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;

    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a key
   */
  delete(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;

    // Remove from tag index
    for (const tag of entry.tags) {
      const keys = this.tagIndex.get(tag);
      if (keys) {
        keys.delete(key);
      }
    }

    return this.store.delete(key);
  }

  /**
   * Invalidate all keys with a tag
   */
  invalidateTag(tag: string): number {
    const keys = this.tagIndex.get(tag);
    if (!keys) return 0;

    let count = 0;
    for (const key of keys) {
      if (this.delete(key)) {
        count++;
      }
    }

    this.tagIndex.delete(tag);
    return count;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.store.clear();
    this.tagIndex.clear();
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      entries: this.store.size,
      tags: this.tagIndex.size,
      memory: process.memoryUsage().heapUsed,
    };
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt < now) {
        if (this.delete(key)) {
          removed++;
        }
      }
    }

    return removed;
  }
}

/**
 * Global cache instance
 */
const cacheStore = new CacheStore();

/**
 * Cache TTL presets
 */
export const CacheTTL = {
  // Very short (real-time data)
  SHORT: 60 * 1000, // 1 minute
  // Short (frequently updated)
  MEDIUM: 5 * 60 * 1000, // 5 minutes
  // Standard (slightly stale acceptable)
  DEFAULT: 15 * 60 * 1000, // 15 minutes
  // Long (rarely changes)
  LONG: 60 * 60 * 1000, // 1 hour
  // Very long (static data)
  VERY_LONG: 24 * 60 * 60 * 1000, // 1 day
};

/**
 * Cache tags for invalidation
 */
export const CacheTags = {
  // User & Auth
  USER: 'user',
  AUTH: 'auth',
  PROFILE: 'profile',
  // Appointments
  APPOINTMENTS: 'appointments',
  APPOINTMENT: 'appointment',
  DOCTOR_SCHEDULE: 'doctor_schedule',
  // Patient Data
  PATIENT_DATA: 'patient_data',
  MEDICAL_RECORDS: 'medical_records',
  PRESCRIPTIONS: 'prescriptions',
  // Doctor Data
  DOCTOR_LIST: 'doctor_list',
  DOCTOR_PROFILE: 'doctor_profile',
  // Payments
  TRANSACTIONS: 'transactions',
  INVOICES: 'invoices',
};

/**
 * Get cached value or fetch fresh
 */
export async function getCachedOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: {
    ttl?: number;
    tags?: string[];
  }
): Promise<T> {
  // Check cache first
  const cached = cacheStore.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetcher();

  // Store in cache
  cacheStore.set(key, data, options?.ttl || CacheTTL.DEFAULT, options?.tags);

  return data;
}

/**
 * Set cache value
 */
export function setCacheValue<T>(
  key: string,
  value: T,
  options?: {
    ttl?: number;
    tags?: string[];
  }
): void {
  cacheStore.set(key, value, options?.ttl || CacheTTL.DEFAULT, options?.tags);
}

/**
 * Get cache value
 */
export function getCacheValue<T>(key: string): T | null {
  return cacheStore.get<T>(key);
}

/**
 * Delete cache value
 */
export function deleteCacheValue(key: string): boolean {
  return cacheStore.delete(key);
}

/**
 * Invalidate cache by tag
 */
export function invalidateCacheTag(tag: string): number {
  const count = cacheStore.invalidateTag(tag);
  console.log(`[CACHE] Invalidated ${count} entries for tag: ${tag}`);
  return count;
}

/**
 * Invalidate multiple tags
 */
export function invalidateCacheTags(tags: string[]): number {
  let total = 0;
  for (const tag of tags) {
    total += cacheStore.invalidateTag(tag);
  }
  console.log(`[CACHE] Invalidated ${total} entries for ${tags.length} tags`);
  return total;
}

/**
 * Clear all cache
 */
export function clearAllCache(): void {
  cacheStore.clear();
  console.log('[CACHE] All cache cleared');
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return cacheStore.getStats();
}

/**
 * Clean up expired entries
 */
export function cleanupExpiredCache(): number {
  const removed = cacheStore.cleanup();
  if (removed > 0) {
    console.log(`[CACHE] Cleaned up ${removed} expired entries`);
  }
  return removed;
}

/**
 * Cache key generators
 */
export const CacheKeys = {
  // User keys
  user: (userId: string) => `user:${userId}`,
  userProfile: (userId: string) => `user:profile:${userId}`,
  userAuth: (userId: string) => `user:auth:${userId}`,

  // Appointment keys
  appointments: (userId: string) => `appointments:user:${userId}`,
  appointment: (appointmentId: string) => `appointment:${appointmentId}`,
  doctorSchedule: (doctorId: string, date: string) =>
    `doctor:schedule:${doctorId}:${date}`,

  // Patient keys
  patientProfile: (patientId: string) => `patient:profile:${patientId}`,
  patientMedicalHistory: (patientId: string) => `patient:history:${patientId}`,
  patientPrescriptions: (patientId: string) => `patient:prescriptions:${patientId}`,

  // Doctor keys
  doctors: (specialty?: string) =>
    specialty ? `doctors:${specialty}` : 'doctors:all',
  doctorProfile: (doctorId: string) => `doctor:profile:${doctorId}`,

  // Payment keys
  transactions: (userId: string) => `transactions:${userId}`,
  invoices: (userId: string) => `invoices:${userId}`,
};

/**
 * Smart cache wrapper for services
 */
export class CachedService {
  /**
   * Cache a service method
   */
  static async withCache<T>(
    key: string,
    executor: () => Promise<T>,
    options?: {
      ttl?: number;
      tags?: string[];
      forceRefresh?: boolean;
    }
  ): Promise<T> {
    // Force refresh if requested
    if (options?.forceRefresh) {
      deleteCacheValue(key);
    }

    // Get cached or fetch fresh
    return getCachedOrFetch(key, executor, {
      ttl: options?.ttl,
      tags: options?.tags,
    });
  }
}

/**
 * Set up automatic cache cleanup (run every hour)
 */
export function startCacheCleanup(intervalMs: number = 60 * 60 * 1000): NodeJS.Timer {
  return setInterval(() => {
    cleanupExpiredCache();
  }, intervalMs);
}
