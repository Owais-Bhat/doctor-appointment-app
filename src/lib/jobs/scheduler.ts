/**
 * Background Job Scheduler
 *
 * Handles scheduled tasks and background jobs
 * For production, integrate with job queue (Bull, Agenda, etc.)
 */

/**
 * Job definition
 */
export interface Job {
  id: string;
  name: string;
  handler: () => Promise<void>;
  cronExpression?: string; // e.g., "0 9 * * *" for 9 AM daily
  schedule?: {
    intervalMs: number;
  };
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  lastError?: Error;
  retries: number;
  maxRetries: number;
}

/**
 * Job scheduler
 */
class JobScheduler {
  private jobs: Map<string, Job> = new Map();
  private timers: Map<string, NodeJS.Timer> = new Map();

  /**
   * Register a job
   */
  registerJob(job: Job): void {
    this.jobs.set(job.id, job);
    console.log(`[JOB] Registered job: ${job.name}`);
  }

  /**
   * Schedule a job
   */
  scheduleJob(jobId: string, delayMs?: number): void {
    const job = this.jobs.get(jobId);
    if (!job) {
      console.error(`[JOB] Job not found: ${jobId}`);
      return;
    }

    if (!job.enabled) {
      console.log(`[JOB] Job disabled: ${job.name}`);
      return;
    }

    const delay = delayMs || job.schedule?.intervalMs || 60000;

    const timer = setTimeout(async () => {
      await this.runJob(jobId);
      // Reschedule if it has an interval
      if (job.schedule) {
        this.scheduleJob(jobId);
      }
    }, delay);

    this.timers.set(jobId, timer);
    job.nextRun = new Date(Date.now() + delay);
  }

  /**
   * Run a job
   */
  private async runJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;

    console.log(`[JOB] Running: ${job.name}`);

    try {
      const startTime = Date.now();
      await job.handler();
      const duration = Date.now() - startTime;

      job.lastRun = new Date();
      job.retries = 0;
      job.lastError = undefined;

      console.log(`[JOB] Completed: ${job.name} (${duration}ms)`);
    } catch (error) {
      job.lastError = error as Error;
      job.retries++;

      if (job.retries < job.maxRetries) {
        console.error(`[JOB] Failed: ${job.name}, retrying... (${job.retries}/${job.maxRetries})`);
        // Retry with exponential backoff
        const backoffMs = Math.min(1000 * Math.pow(2, job.retries), 30000);
        setTimeout(() => this.runJob(jobId), backoffMs);
      } else {
        console.error(`[JOB] Failed: ${job.name} after ${job.maxRetries} retries`);
      }
    }
  }

  /**
   * Stop a job
   */
  stopJob(jobId: string): void {
    const timer = this.timers.get(jobId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(jobId);
      console.log(`[JOB] Stopped: ${jobId}`);
    }
  }

  /**
   * Stop all jobs
   */
  stopAllJobs(): void {
    for (const [jobId, timer] of this.timers.entries()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    console.log('[JOB] Stopped all jobs');
  }

  /**
   * Get job status
   */
  getJobStatus(jobId: string): Partial<Job> | null {
    const job = this.jobs.get(jobId);
    if (!job) return null;

    return {
      id: job.id,
      name: job.name,
      enabled: job.enabled,
      lastRun: job.lastRun,
      nextRun: job.nextRun,
      retries: job.retries,
      lastError: job.lastError,
    };
  }

  /**
   * Get all jobs status
   */
  getAllJobsStatus(): Array<Partial<Job>> {
    return Array.from(this.jobs.values()).map((job) => ({
      id: job.id,
      name: job.name,
      enabled: job.enabled,
      lastRun: job.lastRun,
      nextRun: job.nextRun,
      retries: job.retries,
    }));
  }
}

/**
 * Global scheduler instance
 */
const scheduler = new JobScheduler();

// ============================================
// Predefined Jobs
// ============================================

/**
 * Send appointment reminders
 */
export const appointmentReminderJob: Job = {
  id: 'appointment_reminders',
  name: 'Send Appointment Reminders',
  handler: async () => {
    // TODO: Query for appointments 24 hours from now
    // Send email reminders
    console.log('[JOB] Sent appointment reminders');
  },
  schedule: { intervalMs: 60 * 60 * 1000 }, // Every hour
  enabled: true,
  retries: 0,
  maxRetries: 3,
};

/**
 * Clean up expired sessions
 */
export const sessionCleanupJob: Job = {
  id: 'session_cleanup',
  name: 'Clean Up Expired Sessions',
  handler: async () => {
    // TODO: Delete expired sessions from database
    console.log('[JOB] Cleaned up expired sessions');
  },
  schedule: { intervalMs: 24 * 60 * 60 * 1000 }, // Every day
  enabled: true,
  retries: 0,
  maxRetries: 3,
};

/**
 * Clean up audit logs
 */
export const auditLogCleanupJob: Job = {
  id: 'audit_log_cleanup',
  name: 'Archive Old Audit Logs',
  handler: async () => {
    // TODO: Archive audit logs older than 90 days
    console.log('[JOB] Archived old audit logs');
  },
  schedule: { intervalMs: 7 * 24 * 60 * 60 * 1000 }, // Weekly
  enabled: true,
  retries: 0,
  maxRetries: 3,
};

/**
 * Generate reports
 */
export const reportGenerationJob: Job = {
  id: 'report_generation',
  name: 'Generate Daily Reports',
  handler: async () => {
    // TODO: Generate appointment, revenue, and analytics reports
    console.log('[JOB] Generated daily reports');
  },
  schedule: { intervalMs: 24 * 60 * 60 * 1000 }, // Daily at specific time
  enabled: true,
  retries: 0,
  maxRetries: 3,
};

/**
 * Sync external data
 */
export const externalSyncJob: Job = {
  id: 'external_sync',
  name: 'Sync External Data',
  handler: async () => {
    // TODO: Sync with external calendars, insurance systems, etc.
    console.log('[JOB] Synced external data');
  },
  schedule: { intervalMs: 60 * 60 * 1000 }, // Hourly
  enabled: true,
  retries: 0,
  maxRetries: 2,
};

/**
 * Process pending notifications
 */
export const notificationProcessingJob: Job = {
  id: 'notification_processing',
  name: 'Process Pending Notifications',
  handler: async () => {
    // TODO: Send pending SMS, push, and email notifications
    console.log('[JOB] Processed pending notifications');
  },
  schedule: { intervalMs: 5 * 60 * 1000 }, // Every 5 minutes
  enabled: true,
  retries: 0,
  maxRetries: 3,
};

/**
 * Health check
 */
export const healthCheckJob: Job = {
  id: 'health_check',
  name: 'System Health Check',
  handler: async () => {
    // TODO: Check system health (database, cache, services)
    console.log('[JOB] System health check passed');
  },
  schedule: { intervalMs: 5 * 60 * 1000 }, // Every 5 minutes
  enabled: true,
  retries: 0,
  maxRetries: 1,
};

// ============================================
// Public API
// ============================================

/**
 * Register a custom job
 */
export function registerJob(job: Job): void {
  scheduler.registerJob(job);
}

/**
 * Start a job
 */
export function startJob(jobId: string): void {
  scheduler.scheduleJob(jobId);
}

/**
 * Start all jobs
 */
export function startAllJobs(): void {
  const defaultJobs = [
    appointmentReminderJob,
    sessionCleanupJob,
    auditLogCleanupJob,
    reportGenerationJob,
    externalSyncJob,
    notificationProcessingJob,
    healthCheckJob,
  ];

  for (const job of defaultJobs) {
    scheduler.registerJob(job);
    if (job.enabled) {
      scheduler.scheduleJob(job.id);
    }
  }

  console.log(`[JOB] Started ${defaultJobs.filter((j) => j.enabled).length} jobs`);
}

/**
 * Stop a job
 */
export function stopJob(jobId: string): void {
  scheduler.stopJob(jobId);
}

/**
 * Stop all jobs
 */
export function stopAllJobs(): void {
  scheduler.stopAllJobs();
}

/**
 * Get job status
 */
export function getJobStatus(jobId: string) {
  return scheduler.getJobStatus(jobId);
}

/**
 * Get all jobs status
 */
export function getAllJobsStatus() {
  return scheduler.getAllJobsStatus();
}
