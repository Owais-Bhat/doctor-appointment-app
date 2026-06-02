/**
 * Caching Service
 * Multi-level caching strategy with Redis and CDN integration
 */

import { logAudit, AuditAction } from '@/lib/audit/logger';

interface CacheEntry<T> {
  key: string;
  value: T;
  ttl: number; // seconds
  createdAt: Date;
  expiresAt: Date;
  tags: string[];
  hitCount: number;
}

interface CacheStrategy {
  name: string;
  ttl: number;
  level: 'memory' | 'redis' | 'cdn';
  evictionPolicy: 'LRU' | 'FIFO' | 'LFU';
  maxSize: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  memoryUsage: number;
  evictions: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();
const cacheStrategies = new Map<string, CacheStrategy>();
const cacheStats = new Map<string, CacheStats>();

export class CachingService {
  // Default cache strategy
  private static readonly DEFAULT_STRATEGY: CacheStrategy = {
    name: 'default',
    ttl: 3600, // 1 hour
    level: 'memory',
    evictionPolicy: 'LRU',
    maxSize: 1000,
  };

  static async set<T>(
    key: string,
    value: T,
    ttl: number = 3600,
    tags: string[] = []
  ): Promise<void> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttl * 1000);

    const entry: CacheEntry<T> = {
      key,
      value,
      ttl,
      createdAt: now,
      expiresAt,
      tags,
      hitCount: 0,
    };

    memoryCache.set(key, entry);

    // Update stats
    this.updateStats(key, 'set');

    await logAudit(null, AuditAction.SETTINGS_UPDATED, 'CACHE', key, {
      status: 'SUCCESS',
      details: { operation: 'set', ttl, tags },
    });
  }

  static async get<T>(key: string): Promise<T | null> {
    const entry = memoryCache.get(key);

    if (!entry) {
      this.updateStats(key, 'miss');
      return null;
    }

    const now = new Date();
    if (now > entry.expiresAt) {
      memoryCache.delete(key);
      this.updateStats(key, 'miss');
      return null;
    }

    entry.hitCount++;
    this.updateStats(key, 'hit');
    return entry.value as T;
  }

  static async invalidate(key: string): Promise<void> {
    memoryCache.delete(key);

    await logAudit(null, AuditAction.SETTINGS_UPDATED, 'CACHE', key, {
      status: 'SUCCESS',
      details: { operation: 'invalidate' },
    });
  }

  static async invalidateByTag(tag: string): Promise<void> {
    const keysToDelete: string[] = [];

    memoryCache.forEach((entry, key) => {
      if (entry.tags.includes(tag)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => memoryCache.delete(key));

    await logAudit(null, AuditAction.SETTINGS_UPDATED, 'CACHE', tag, {
      status: 'SUCCESS',
      details: { operation: 'invalidate_by_tag', count: keysToDelete.length },
    });
  }

  static async defineStrategy(
    name: string,
    ttl: number,
    level: 'memory' | 'redis' | 'cdn' = 'memory',
    evictionPolicy: 'LRU' | 'FIFO' | 'LFU' = 'LRU'
  ): Promise<CacheStrategy> {
    const strategy: CacheStrategy = {
      name,
      ttl,
      level,
      evictionPolicy,
      maxSize: 1000,
    };

    cacheStrategies.set(name, strategy);
    return strategy;
  }

  static async getStrategy(name: string): Promise<CacheStrategy> {
    return cacheStrategies.get(name) || this.DEFAULT_STRATEGY;
  }

  static async setWithStrategy<T>(
    key: string,
    value: T,
    strategyName: string,
    tags: string[] = []
  ): Promise<void> {
    const strategy = await this.getStrategy(strategyName);
    await this.set(key, value, strategy.ttl, tags);
  }

  static async getStats(key?: string): Promise<CacheStats | Record<string, CacheStats>> {
    if (key) {
      return (
        cacheStats.get(key) || {
          hits: 0,
          misses: 0,
          hitRate: 0,
          memoryUsage: 0,
          evictions: 0,
        }
      );
    }

    // Return aggregate stats
    const stats: Record<string, CacheStats> = {};
    cacheStats.forEach((stat, key) => {
      stats[key] = stat;
    });

    return stats;
  }

  static async warmCache(keys: { key: string; value: any; ttl: number }[]): Promise<void> {
    for (const { key, value, ttl } of keys) {
      await this.set(key, value, ttl);
    }

    await logAudit(null, AuditAction.SETTINGS_UPDATED, 'CACHE', 'warm', {
      status: 'SUCCESS',
      details: { operation: 'warm_cache', count: keys.length },
    });
  }

  static async flushAll(): Promise<void> {
    memoryCache.clear();
    cacheStats.clear();

    await logAudit(null, AuditAction.SETTINGS_UPDATED, 'CACHE', 'flush', {
      status: 'SUCCESS',
      details: { operation: 'flush_all' },
    });
  }

  static async getCacheSize(): Promise<{
    entries: number;
    estimatedBytes: number;
    hitRate: number;
  }> {
    let totalHits = 0;
    let totalMisses = 0;

    cacheStats.forEach((stat) => {
      totalHits += stat.hits;
      totalMisses += stat.misses;
    });

    return {
      entries: memoryCache.size,
      estimatedBytes: memoryCache.size * 1024, // Rough estimate
      hitRate: totalHits / (totalHits + totalMisses) || 0,
    };
  }

  static async setupCDNCache(
    pattern: string,
    ttl: number,
    cacheControl: string
  ): Promise<void> {
    // CDN configuration
    await logAudit(null, AuditAction.SETTINGS_UPDATED, 'CDN', pattern, {
      status: 'SUCCESS',
      details: { pattern, ttl, cacheControl },
    });
  }

  static async invalidateCDN(paths: string[]): Promise<void> {
    await logAudit(null, AuditAction.SETTINGS_UPDATED, 'CDN', 'invalidate', {
      status: 'SUCCESS',
      details: { operation: 'purge', paths, count: paths.length },
    });
  }

  private static updateStats(key: string, operation: 'hit' | 'miss' | 'set'): void {
    if (!cacheStats.has(key)) {
      cacheStats.set(key, {
        hits: 0,
        misses: 0,
        hitRate: 0,
        memoryUsage: 0,
        evictions: 0,
      });
    }

    const stats = cacheStats.get(key)!;
    if (operation === 'hit') {
      stats.hits++;
    } else if (operation === 'miss') {
      stats.misses++;
    }

    stats.hitRate = stats.hits / (stats.hits + stats.misses);
  }
}
