/**
 * Benchmarking Service
 *
 * Compares organization metrics against industry benchmarks and peer groups
 */

import { Benchmark } from '@/lib/validations';
import { logAudit, AuditAction } from '@/lib/audit/logger';
import { ApiErrors } from '@/lib/api/response';

export class BenchmarkingService {
  /**
   * Get benchmarks for metric
   */
  static async getBenchmark(
    organizationId: string,
    metricName: string,
    userId: string
  ) {
    try {
      const organizationValue = await this.getOrganizationMetricValue(
        organizationId,
        metricName
      );

      const industryBenchmark = this.getIndustryBenchmark(metricName);

      const benchmark: Benchmark = {
        metricName,
        organizationId,
        organizationValue,
        industryAverage: industryBenchmark.average,
        industryMin: industryBenchmark.min,
        industryMax: industryBenchmark.max,
        percentile: this.calculatePercentile(organizationValue, industryBenchmark),
        trend: this.calculateTrend(organizationValue, industryBenchmark.average),
        period: new Date().toISOString().split('T')[0],
      };

      await logAudit(
        userId,
        AuditAction.DATA_ACCESSED,
        'ANALYTICS',
        null,
        { details: { metric: 'benchmark', name: metricName } }
      );

      return { status: 200, body: { success: true, data: benchmark } };
    } catch (error) {
      console.error('Error fetching benchmark:', error);
      return ApiErrors.internalError();
    }
  }

  /**
   * Get all benchmarks
   */
  static async getAllBenchmarks(
    organizationId: string,
    userId: string
  ) {
    try {
      const metrics = [
        'revenue_per_appointment',
        'appointment_utilization',
        'patient_satisfaction',
        'claim_denial_rate',
        'no_show_rate',
        'staff_productivity',
        'patient_retention',
        'treatment_completion_rate',
      ];

      const benchmarks = await Promise.all(
        metrics.map(metric =>
          this.getBenchmark(organizationId, metric, userId).then(r => r.body.data)
        )
      );

      return { status: 200, body: { success: true, data: benchmarks } };
    } catch (error) {
      console.error('Error fetching all benchmarks:', error);
      return ApiErrors.internalError();
    }
  }

  /**
   * Get peer group comparison
   */
  static async getPeerGroupComparison(
    organizationId: string,
    clinicSize: 'small' | 'medium' | 'large',
    userId: string
  ) {
    try {
      const comparison = await this.fetchPeerGroupComparisonFromDatabase(
        organizationId,
        clinicSize
      );

      return { status: 200, body: { success: true, data: comparison } };
    } catch (error) {
      console.error('Error fetching peer comparison:', error);
      return ApiErrors.internalError();
    }
  }

  /**
   * Get performance trends
   */
  static async getPerformanceTrends(
    organizationId: string,
    metricName: string,
    months: number = 12,
    userId: string
  ) {
    try {
      const trends = await this.fetchPerformanceTrendsFromDatabase(
        organizationId,
        metricName,
        months
      );

      return { status: 200, body: { success: true, data: trends } };
    } catch (error) {
      console.error('Error fetching performance trends:', error);
      return ApiErrors.internalError();
    }
  }

  /**
   * Get improvement opportunities
   */
  static async getImprovementOpportunities(
    organizationId: string,
    userId: string
  ) {
    try {
      const benchmarks = await this.getAllBenchmarks(organizationId, userId);

      const opportunities = benchmarks.body.data
        .filter((b: Benchmark) => b.percentile < 50) // Bottom 50%
        .sort((a: Benchmark, b: Benchmark) => a.percentile - b.percentile)
        .slice(0, 5); // Top 5 opportunities

      return { status: 200, body: { success: true, data: opportunities } };
    } catch (error) {
      console.error('Error fetching improvement opportunities:', error);
      return ApiErrors.internalError();
    }
  }

  /**
   * Get strength areas
   */
  static async getStrengthAreas(
    organizationId: string,
    userId: string
  ) {
    try {
      const benchmarks = await this.getAllBenchmarks(organizationId, userId);

      const strengths = benchmarks.body.data
        .filter((b: Benchmark) => b.percentile > 75) // Top 25%
        .sort((a: Benchmark, b: Benchmark) => b.percentile - a.percentile)
        .slice(0, 5); // Top 5 strengths

      return { status: 200, body: { success: true, data: strengths } };
    } catch (error) {
      console.error('Error fetching strength areas:', error);
      return ApiErrors.internalError();
    }
  }

  // ============================================
  // Helper Methods
  // ============================================

  private static getIndustryBenchmark(metricName: string): any {
    // Industry benchmarks (these would come from a database in production)
    const benchmarks: Record<string, any> = {
      revenue_per_appointment: { average: 200, min: 100, max: 400 },
      appointment_utilization: { average: 75, min: 50, max: 95 },
      patient_satisfaction: { average: 4.2, min: 3.5, max: 4.8 },
      claim_denial_rate: { average: 8, min: 3, max: 15 },
      no_show_rate: { average: 12, min: 5, max: 20 },
      staff_productivity: { average: 80, min: 60, max: 95 },
      patient_retention: { average: 70, min: 50, max: 85 },
      treatment_completion_rate: { average: 85, min: 70, max: 95 },
    };

    return benchmarks[metricName] || { average: 0, min: 0, max: 100 };
  }

  private static calculatePercentile(value: number, benchmark: any): number {
    // Calculate what percentile this value is at
    if (benchmark.max === benchmark.min) return 50;
    return ((value - benchmark.min) / (benchmark.max - benchmark.min)) * 100;
  }

  private static calculateTrend(
    value: number,
    average: number
  ): 'up' | 'down' | 'stable' {
    const variance = Math.abs(value - average) / average;
    if (variance < 0.05) return 'stable';
    return value > average ? 'up' : 'down';
  }

  private static async getOrganizationMetricValue(
    organizationId: string,
    metricName: string
  ): Promise<number> {
    // TODO: Query database for organization's current metric value
    return 0;
  }

  private static async fetchPeerGroupComparisonFromDatabase(
    organizationId: string,
    clinicSize: string
  ): Promise<any> {
    // TODO: Query database for peer group comparison
    return {};
  }

  private static async fetchPerformanceTrendsFromDatabase(
    organizationId: string,
    metricName: string,
    months: number
  ): Promise<any[]> {
    // TODO: Query database for historical trends
    return [];
  }
}
