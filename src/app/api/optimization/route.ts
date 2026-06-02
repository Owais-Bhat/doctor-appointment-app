/**
 * Optimization API Routes
 *
 * POST /api/optimization
 * - action: analyze-query - Analyze query performance
 * - action: implement-index - Implement index recommendation
 * - action: optimize-query - Get optimization suggestions
 * - action: vacuum - Run vacuum and analyze
 * - action: cache-set - Set cache value
 * - action: cache-invalidate - Invalidate cache
 * - action: warm-cache - Warm cache with data
 * - action: flush-cache - Clear all cache
 *
 * GET /api/optimization
 * - action: slow-queries - Get slow queries
 * - action: index-recommendations - Get index recommendations
 * - action: table-stats - Get table statistics
 * - action: partitioning - Get partitioning strategy
 * - action: cache-stats - Get cache statistics
 * - action: cache-size - Get cache size
 */

import { NextRequest, NextResponse } from 'next/server';
import { DatabaseOptimizationService } from '@/lib/services/databaseOptimizationService';
import { CachingService } from '@/lib/services/cachingService';
import { rateLimit } from '@/lib/middleware/rateLimiter';
import { securityHeaders } from '@/lib/middleware/securityHeaders';

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

    if (action === 'analyze-query') {
      const { query } = body;

      if (!query) {
        return NextResponse.json(
          { success: false, error: 'Missing query' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const metric = await DatabaseOptimizationService.analyzeQueryPerformance(query);

      return NextResponse.json(
        { success: true, data: metric },
        { status: 201, headers: securityHeaders() }
      );
    } else if (action === 'implement-index') {
      const { recommendationId } = body;

      if (!recommendationId) {
        return NextResponse.json(
          { success: false, error: 'Missing recommendation ID' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const recommendation =
        await DatabaseOptimizationService.getIndexRecommendationById(recommendationId);
      if (!recommendation) {
        return NextResponse.json(
          { success: false, error: 'Recommendation not found' },
          { status: 404, headers: securityHeaders() }
        );
      }

      await DatabaseOptimizationService.implementIndex(recommendation);

      return NextResponse.json(
        { success: true, data: recommendation },
        { status: 201, headers: securityHeaders() }
      );
    } else if (action === 'optimize-query') {
      const { query } = body;

      if (!query) {
        return NextResponse.json(
          { success: false, error: 'Missing query' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const plan = await DatabaseOptimizationService.optimizeQuery(query);

      return NextResponse.json(
        { success: true, data: plan },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'vacuum') {
      const { tableName } = body;

      if (!tableName) {
        return NextResponse.json(
          { success: false, error: 'Missing table name' },
          { status: 400, headers: securityHeaders() }
        );
      }

      await DatabaseOptimizationService.vacuumAndAnalyze(tableName);

      return NextResponse.json(
        { success: true, message: 'Vacuum and analyze completed' },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'cache-set') {
      const { key, value, ttl, tags } = body;

      if (!key || value === undefined) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400, headers: securityHeaders() }
        );
      }

      await CachingService.set(key, value, ttl || 3600, tags || []);

      return NextResponse.json(
        { success: true },
        { status: 201, headers: securityHeaders() }
      );
    } else if (action === 'cache-invalidate') {
      const { key, tag } = body;

      if (!key && !tag) {
        return NextResponse.json(
          { success: false, error: 'Missing key or tag' },
          { status: 400, headers: securityHeaders() }
        );
      }

      if (key) {
        await CachingService.invalidate(key);
      } else if (tag) {
        await CachingService.invalidateByTag(tag);
      }

      return NextResponse.json(
        { success: true },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'warm-cache') {
      const { entries } = body;

      if (!Array.isArray(entries)) {
        return NextResponse.json(
          { success: false, error: 'Invalid entries' },
          { status: 400, headers: securityHeaders() }
        );
      }

      await CachingService.warmCache(entries);

      return NextResponse.json(
        { success: true },
        { status: 201, headers: securityHeaders() }
      );
    } else if (action === 'flush-cache') {
      await CachingService.flushAll();

      return NextResponse.json(
        { success: true },
        { status: 200, headers: securityHeaders() }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400, headers: securityHeaders() }
      );
    }
  } catch (error) {
    console.error('Error in POST /api/optimization:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}

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
    const tableName = req.nextUrl.searchParams.get('tableName');
    const key = req.nextUrl.searchParams.get('key');

    if (action === 'slow-queries') {
      const threshold = req.nextUrl.searchParams.get('threshold');
      const queries = await DatabaseOptimizationService.getSlowQueries(
        threshold ? parseInt(threshold) : 500
      );

      return NextResponse.json(
        { success: true, data: { queries } },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'index-recommendations') {
      if (!tableName) {
        return NextResponse.json(
          { success: false, error: 'Missing table name' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const recommendations = await DatabaseOptimizationService.recommendIndexes(tableName);

      return NextResponse.json(
        { success: true, data: { recommendations } },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'table-stats') {
      if (!tableName) {
        return NextResponse.json(
          { success: false, error: 'Missing table name' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const stats = await DatabaseOptimizationService.getTableStatistics(tableName);

      return NextResponse.json(
        { success: true, data: stats },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'partitioning') {
      if (!tableName) {
        return NextResponse.json(
          { success: false, error: 'Missing table name' },
          { status: 400, headers: securityHeaders() }
        );
      }

      const strategy = await DatabaseOptimizationService.getPartitioningStrategy(tableName);

      return NextResponse.json(
        { success: true, data: strategy },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'cache-stats') {
      const stats = await CachingService.getStats(key || undefined);

      return NextResponse.json(
        { success: true, data: stats },
        { status: 200, headers: securityHeaders() }
      );
    } else if (action === 'cache-size') {
      const size = await CachingService.getCacheSize();

      return NextResponse.json(
        { success: true, data: size },
        { status: 200, headers: securityHeaders() }
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400, headers: securityHeaders() }
      );
    }
  } catch (error) {
    console.error('Error in GET /api/optimization:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: securityHeaders() }
    );
  }
}
