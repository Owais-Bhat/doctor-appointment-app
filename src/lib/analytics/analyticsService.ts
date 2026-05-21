/**
 * Analytics Service
 *
 * Collect and report on platform metrics
 * Used for admin dashboard and reporting
 */

/**
 * Appointment metrics
 */
export interface AppointmentMetrics {
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowRate: number; // percentage
  averageDuration: number; // in minutes
  bookingLeadTime: number; // average days in advance
  appointmentsByType: Record<string, number>;
  appointmentsByStatus: Record<string, number>;
}

/**
 * Revenue metrics
 */
export interface RevenueMetrics {
  totalRevenue: number;
  averageTransaction: number;
  transactionCount: number;
  paymentMethods: Record<string, number>;
  refundRate: number; // percentage
  totalRefunds: number;
  topDoctorsByRevenue: { doctorId: string; revenue: number }[];
}

/**
 * Doctor metrics
 */
export interface DoctorMetrics {
  doctorId: string;
  name: string;
  specialty: string;
  appointmentsCompleted: number;
  appointmentsCancelled: number;
  averageRating: number; // 1-5
  patientSatisfaction: number; // percentage
  revenue: number;
  consultationFee: number;
  avgConsultationDuration: number;
}

/**
 * Patient metrics
 */
export interface PatientMetrics {
  totalPatients: number;
  activePatients: number;
  returningPatients: number;
  newPatients: number;
  averageAppointmentsPerPatient: number;
  patientRetentionRate: number; // percentage
  commonReasons: { reason: string; count: number }[];
}

/**
 * System health metrics
 */
export interface SystemHealthMetrics {
  apiUptime: number; // percentage
  averageResponseTime: number; // milliseconds
  errorRate: number; // percentage
  cacheHitRate: number; // percentage
  videoConsultationQuality: string; // average quality level
  databaseConnections: number;
  storageUsed: number; // bytes
}

/**
 * Analytics service
 */
export class AnalyticsService {
  private metrics: Map<string, any> = new Map();
  private events: Array<{ timestamp: Date; eventType: string; data: any }> = [];

  /**
   * Track event
   */
  trackEvent(eventType: string, data: any): void {
    this.events.push({
      timestamp: new Date(),
      eventType,
      data,
    });

    // Keep last 1000 events
    if (this.events.length > 1000) {
      this.events.shift();
    }
  }

  /**
   * Get appointment metrics
   */
  getAppointmentMetrics(period: 'day' | 'week' | 'month' | 'year' = 'month'): AppointmentMetrics {
    // TODO: Query from database
    const startDate = this.getStartDate(period);

    return {
      totalAppointments: 245,
      completedAppointments: 218,
      cancelledAppointments: 18,
      noShowRate: 3.7,
      averageDuration: 32,
      bookingLeadTime: 5.2,
      appointmentsByType: {
        in_person: 120,
        video: 85,
        phone: 40,
      },
      appointmentsByStatus: {
        completed: 218,
        cancelled: 18,
        no_show: 9,
      },
    };
  }

  /**
   * Get revenue metrics
   */
  getRevenueMetrics(period: 'day' | 'week' | 'month' | 'year' = 'month'): RevenueMetrics {
    // TODO: Query from database
    const startDate = this.getStartDate(period);

    return {
      totalRevenue: 12345000, // in cents ($123,450)
      averageTransaction: 5000,
      transactionCount: 245,
      paymentMethods: {
        credit_card: 8765000,
        insurance: 2180000,
        bank_transfer: 1400000,
      },
      refundRate: 2.5,
      totalRefunds: 312000,
      topDoctorsByRevenue: [
        { doctorId: 'doc_1', revenue: 3500000 },
        { doctorId: 'doc_2', revenue: 2800000 },
        { doctorId: 'doc_3', revenue: 2100000 },
      ],
    };
  }

  /**
   * Get doctor metrics
   */
  getDoctorMetrics(doctorId: string): DoctorMetrics {
    // TODO: Query from database
    return {
      doctorId,
      name: 'Dr. John Smith',
      specialty: 'Cardiology',
      appointmentsCompleted: 145,
      appointmentsCancelled: 8,
      averageRating: 4.7,
      patientSatisfaction: 94,
      revenue: 3500000,
      consultationFee: 5000,
      avgConsultationDuration: 28,
    };
  }

  /**
   * Get all doctor metrics
   */
  getAllDoctorMetrics(): DoctorMetrics[] {
    // TODO: Query from database
    return [
      this.getDoctorMetrics('doc_1'),
      this.getDoctorMetrics('doc_2'),
      this.getDoctorMetrics('doc_3'),
    ];
  }

  /**
   * Get patient metrics
   */
  getPatientMetrics(): PatientMetrics {
    // TODO: Query from database
    return {
      totalPatients: 1245,
      activePatients: 892,
      returningPatients: 756,
      newPatients: 136,
      averageAppointmentsPerPatient: 1.96,
      patientRetentionRate: 61,
      commonReasons: [
        { reason: 'General checkup', count: 89 },
        { reason: 'Follow-up', count: 72 },
        { reason: 'Specialist referral', count: 65 },
        { reason: 'Preventive care', count: 54 },
        { reason: 'Acute condition', count: 48 },
      ],
    };
  }

  /**
   * Get system health metrics
   */
  getSystemHealthMetrics(): SystemHealthMetrics {
    // TODO: Get from monitoring system
    return {
      apiUptime: 99.95,
      averageResponseTime: 45,
      errorRate: 0.05,
      cacheHitRate: 88.3,
      videoConsultationQuality: '720p',
      databaseConnections: 24,
      storageUsed: 157286400000, // 147 GB
    };
  }

  /**
   * Get trending metrics
   */
  getTrendingMetrics() {
    return {
      appointmentGrowth: 12.5, // percentage week-over-week
      revenueGrowth: 8.3,
      patientGrowth: 6.8,
      avgRatingTrend: -0.2, // declining
      consultationQualityTrend: 1.5, // improving
    };
  }

  /**
   * Get top insights
   */
  getTopInsights() {
    return [
      {
        title: 'High Cancellation Rate',
        description: 'Cancellations increased 15% this month',
        severity: 'warning',
        recommendation: 'Send reminder emails 24 hours before appointments',
      },
      {
        title: 'Popular Doctor',
        description: 'Dr. Smith has highest patient satisfaction (4.9/5)',
        severity: 'positive',
        recommendation: 'Feature in marketing materials',
      },
      {
        title: 'Peak Hours Identified',
        description: 'Most appointments booked 3-5 PM',
        severity: 'info',
        recommendation: 'Ensure staff availability during peak hours',
      },
      {
        title: 'Video Consultation Growth',
        description: 'Video consultations up 35% month-over-month',
        severity: 'positive',
        recommendation: 'Invest in video quality improvements',
      },
    ];
  }

  /**
   * Generate custom report
   */
  generateReport(
    reportType: 'monthly' | 'quarterly' | 'annual',
    includeMetrics: string[] = ['appointments', 'revenue', 'doctors', 'patients', 'health']
  ) {
    const report: any = {
      type: reportType,
      generatedAt: new Date(),
      period: this.getPeriodLabel(reportType),
    };

    if (includeMetrics.includes('appointments')) {
      report.appointments = this.getAppointmentMetrics();
    }

    if (includeMetrics.includes('revenue')) {
      report.revenue = this.getRevenueMetrics();
    }

    if (includeMetrics.includes('doctors')) {
      report.doctors = this.getAllDoctorMetrics();
    }

    if (includeMetrics.includes('patients')) {
      report.patients = this.getPatientMetrics();
    }

    if (includeMetrics.includes('health')) {
      report.health = this.getSystemHealthMetrics();
    }

    report.insights = this.getTopInsights();
    report.trends = this.getTrendingMetrics();

    return report;
  }

  /**
   * Get start date based on period
   */
  private getStartDate(period: string): Date {
    const now = new Date();

    switch (period) {
      case 'day':
        return new Date(now.setDate(now.getDate() - 1));
      case 'week':
        return new Date(now.setDate(now.getDate() - 7));
      case 'month':
        return new Date(now.setMonth(now.getMonth() - 1));
      case 'year':
        return new Date(now.setFullYear(now.getFullYear() - 1));
      default:
        return new Date(now.setMonth(now.getMonth() - 1));
    }
  }

  /**
   * Get period label
   */
  private getPeriodLabel(reportType: string): string {
    const now = new Date();

    switch (reportType) {
      case 'monthly':
        return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      case 'quarterly':
        const quarter = Math.ceil((now.getMonth() + 1) / 3);
        return `Q${quarter} ${now.getFullYear()}`;
      case 'annual':
        return now.getFullYear().toString();
      default:
        return now.toLocaleDateString();
    }
  }

  /**
   * Get event summary
   */
  getEventSummary(eventType?: string, limit: number = 50): any[] {
    let filtered = this.events;

    if (eventType) {
      filtered = filtered.filter((e) => e.eventType === eventType);
    }

    return filtered.slice(-limit).reverse();
  }

  /**
   * Get cohort analysis
   */
  getCohortAnalysis() {
    // TODO: Implement cohort analysis
    return {
      week1Retention: 85,
      week4Retention: 72,
      month3Retention: 62,
      month6Retention: 54,
    };
  }

  /**
   * Clean up old events
   */
  cleanup(): number {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const before = this.events.length;

    this.events = this.events.filter((e) => e.timestamp > thirtyDaysAgo);

    const cleaned = before - this.events.length;
    if (cleaned > 0) {
      console.log(`[ANALYTICS] Cleaned up ${cleaned} old events`);
    }

    return cleaned;
  }
}

/**
 * Global analytics service instance
 */
export const analyticsService = new AnalyticsService();
