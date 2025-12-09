import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { StatusRepository } from '../repositories';
import { ConfigService } from '../config';

/**
 * Service for cleaning up old data based on retention policy
 */
@Injectable()
export class CleanupService implements OnModuleInit {
  private readonly logger = new Logger(CleanupService.name);
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly statusRepository: StatusRepository,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Initialize cleanup scheduler on module startup
   */
  onModuleInit() {
    this.startScheduledCleanup();
  }

  /**
   * Start scheduled cleanup task
   * Runs daily at 2:00 AM
   */
  private startScheduledCleanup(): void {
    // Calculate milliseconds until next 2:00 AM
    const now = new Date();
    const next2AM = new Date();
    next2AM.setHours(2, 0, 0, 0);

    // If it's already past 2 AM today, schedule for tomorrow
    if (now.getTime() > next2AM.getTime()) {
      next2AM.setDate(next2AM.getDate() + 1);
    }

    const msUntilNext2AM = next2AM.getTime() - now.getTime();

    this.logger.log(
      `Scheduling first cleanup at ${next2AM.toISOString()} (in ${Math.round(msUntilNext2AM / 1000 / 60)} minutes)`,
    );

    // Schedule first cleanup
    setTimeout(() => {
      this.cleanupOldData();

      // Then run every 24 hours
      this.cleanupInterval = setInterval(
        () => this.cleanupOldData(),
        24 * 60 * 60 * 1000, // 24 hours
      );
    }, msUntilNext2AM);
  }

  /**
   * Scheduled task to clean up old status records
   */
  async cleanupOldData(): Promise<void> {
    this.logger.log('Starting scheduled data cleanup...');

    try {
      // First, monitor storage to check if cleanup is needed
      const storageStatus = await this.monitorStorage();

      if (!storageStatus.needsCleanup) {
        this.logger.log('No cleanup needed. All data is within retention period.');
        return;
      }

      const retentionDays = this.configService.getDataRetentionDays();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      this.logger.log(
        `Deleting status records older than ${retentionDays} days (before ${cutoffDate.toISOString()})`,
      );

      const deletedCount = await this.statusRepository.deleteOldStatuses(cutoffDate);

      this.logger.log(`Data cleanup completed. Deleted ${deletedCount} old status records.`);

      // Log storage stats after cleanup
      const statsAfter = await this.getStorageStats();
      this.logger.log(`Storage after cleanup: ${statsAfter.totalStatusRecords} records remaining`);
    } catch (error) {
      this.logger.error('Failed to cleanup old data:', error.message);
      this.logger.error(error.stack);
    }
  }

  /**
   * Manually trigger data cleanup
   * Can be called via API or admin interface
   */
  async triggerCleanup(): Promise<{ deletedCount: number }> {
    this.logger.log('Manual data cleanup triggered');

    try {
      const retentionDays = this.configService.getDataRetentionDays();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const deletedCount = await this.statusRepository.deleteOldStatuses(cutoffDate);

      this.logger.log(`Manual cleanup completed. Deleted ${deletedCount} records.`);

      return { deletedCount };
    } catch (error) {
      this.logger.error('Manual cleanup failed:', error.message);
      throw error;
    }
  }

  /**
   * Get storage statistics
   * Returns information about data storage
   */
  async getStorageStats(): Promise<{
    totalStatusRecords: number;
    retentionDays: number;
    oldestRecord: Date | null;
    newestRecord: Date | null;
  }> {
    try {
      const retentionDays = this.configService.getDataRetentionDays();
      const totalStatusRecords = await this.statusRepository.countAllStatusRecords();
      const oldestRecord = await this.statusRepository.findOldestStatusTimestamp();
      const newestRecord = await this.statusRepository.findNewestStatusTimestamp();

      this.logger.log(
        `Storage stats: ${totalStatusRecords} total records, retention: ${retentionDays} days`,
      );

      return {
        totalStatusRecords,
        retentionDays,
        oldestRecord,
        newestRecord,
      };
    } catch (error) {
      this.logger.error('Failed to get storage stats:', error.message);
      throw error;
    }
  }

  /**
   * Monitor storage and trigger cleanup if needed
   * Checks if storage is approaching limits and performs cleanup
   */
  async monitorStorage(): Promise<{
    needsCleanup: boolean;
    totalRecords: number;
    message: string;
  }> {
    try {
      const stats = await this.getStorageStats();
      const retentionDays = this.configService.getDataRetentionDays();

      // Calculate if we have records older than retention period
      let needsCleanup = false;
      let message = 'Storage is within normal limits';

      if (stats.oldestRecord) {
        const oldestDate = new Date(stats.oldestRecord);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

        if (oldestDate < cutoffDate) {
          needsCleanup = true;
          const daysOld = Math.floor((Date.now() - oldestDate.getTime()) / (1000 * 60 * 60 * 24));
          message = `Found records older than ${retentionDays} days (oldest: ${daysOld} days). Cleanup recommended.`;
          this.logger.warn(message);
        }
      }

      // Log storage statistics
      this.logger.log(
        `Storage monitoring: ${stats.totalStatusRecords} records, oldest: ${stats.oldestRecord ? new Date(stats.oldestRecord).toISOString() : 'N/A'}`,
      );

      return {
        needsCleanup,
        totalRecords: stats.totalStatusRecords,
        message,
      };
    } catch (error) {
      this.logger.error('Failed to monitor storage:', error.message);
      throw error;
    }
  }

  /**
   * Stop the cleanup scheduler (for graceful shutdown)
   */
  stopScheduledCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      this.logger.log('Cleanup scheduler stopped');
    }
  }
}
