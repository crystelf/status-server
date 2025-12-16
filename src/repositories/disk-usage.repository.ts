import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { DiskUsageEntity } from '../entities';
import { JsonStorageService } from '../services';

@Injectable()
export class DiskUsageRepository {
  constructor(
    @Inject(forwardRef(() => JsonStorageService))
    private readonly jsonStorageService: JsonStorageService,
  ) {}

  /**
   * Save disk usage for a client
   */
  async saveDiskUsages(clientId: string, diskUsages: any[]): Promise<void> {
    try {
      for (const disk of diskUsages) {
        await this.jsonStorageService.create('diskUsages', {
          clientId,
          device: disk.device,
          size: disk.size,
          used: disk.used,
          available: disk.available,
          usagePercent: disk.usagePercent,
          mountpoint: disk.mountpoint,
          timestamp: new Date(),
        });
      }
    } catch (error) {
      console.error(`Failed to save disk usage for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Get latest disk usage for a client
   */
  async getLatestDiskUsage(clientId: string): Promise<DiskUsageEntity[]> {
    try {
      // Get all disk usage records for the client
      const allRecords = await this.jsonStorageService.findMany('diskUsages', { clientId });
      
      // Group by device and get the latest record for each device
      const latestByDevice = new Map<string, DiskUsageEntity>();
      
      allRecords.forEach(record => {
        const existing = latestByDevice.get(record.device);
        if (!existing || new Date(record.timestamp) > new Date(existing.timestamp)) {
          latestByDevice.set(record.device, record);
        }
      });
      
      return Array.from(latestByDevice.values());
    } catch (error) {
      console.error(`Failed to get latest disk usage for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Get disk usage history for a client within a time range
   */
  async getDiskUsageHistory(
    clientId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<DiskUsageEntity[]> {
    try {
      const options = {
        where: {
          clientId,
          timestamp: { Between: [startTime, endTime] }
        },
        order: {
          timestamp: 'ASC'
        }
      };
      return await this.jsonStorageService.query('diskUsages', options);
    } catch (error) {
      console.error(`Failed to get disk usage history for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Delete old disk usage records before a certain date
   */
  async deleteOldDiskUsages(beforeDate: Date): Promise<number> {
    try {
      const options = {
        where: {
          timestamp: { LessThan: beforeDate }
        }
      };
      const recordsToDelete = await this.jsonStorageService.query('diskUsages', options);
      const count = recordsToDelete.length;
      
      if (count > 0) {
        await this.jsonStorageService.deleteMany('diskUsages', options.where);
      }
      
      return count;
    } catch (error) {
      console.error('Failed to delete old disk usage records:', error);
      throw error;
    }
  }
}