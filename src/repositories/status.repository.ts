import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { StatusEntity } from '../entities';
import { DatabaseRetry } from '../utils';
import { JsonStorageService } from '../services';

@Injectable()
export class StatusRepository {
  constructor(
    @Inject(forwardRef(() => JsonStorageService))
    private readonly jsonStorageService: JsonStorageService,
  ) {}

  /**
   * Save a new status record
   */
  @DatabaseRetry()
  async saveStatus(status: Partial<StatusEntity>): Promise<StatusEntity> {
    return await this.jsonStorageService.create('statuses', status);
  }

  /**
   * Find status history for a client within a time range
   */
  @DatabaseRetry()
  async findStatusHistory(
    clientId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<StatusEntity[]> {
    const options = {
      where: {
        clientId,
        timestamp: { Between: [startTime, endTime] }
      },
      order: {
        timestamp: 'ASC'
      }
    };
    return await this.jsonStorageService.query('statuses', options);
  }

  /**
   * Find the latest status for a client
   */
  @DatabaseRetry()
  async findLatestStatus(clientId: string): Promise<StatusEntity | null> {
    const options = {
      where: { clientId },
      order: {
        timestamp: 'DESC'
      },
      limit: 1
    };
    const results = await this.jsonStorageService.query('statuses', options);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Delete old status records before a certain date
   */
  @DatabaseRetry()
  async deleteOldStatuses(beforeDate: Date): Promise<number> {
    const options = {
      where: {
        timestamp: { LessThan: beforeDate }
      }
    };
    const recordsToDelete = await this.jsonStorageService.query('statuses', options);
    const count = recordsToDelete.length;
    
    if (count > 0) {
      await this.jsonStorageService.deleteMany('statuses', options.where);
    }
    
    return count;
  }

  /**
   * Count status records for a client
   */
  @DatabaseRetry()
  async countStatusRecords(clientId: string): Promise<number> {
    return await this.jsonStorageService.count('statuses', { clientId });
  }

  /**
   * Count all status records across all clients
   */
  @DatabaseRetry()
  async countAllStatusRecords(): Promise<number> {
    return await this.jsonStorageService.count('statuses');
  }

  /**
   * Find the oldest status timestamp across all clients
   */
  @DatabaseRetry()
  async findOldestStatusTimestamp(): Promise<Date | null> {
    const options = {
      order: {
        timestamp: 'ASC'
      },
      limit: 1
    };
    const results = await this.jsonStorageService.query('statuses', options);
    return results.length > 0 ? new Date(results[0].timestamp) : null;
  }

  /**
   * Find the newest status timestamp across all clients
   */
  @DatabaseRetry()
  async findNewestStatusTimestamp(): Promise<Date | null> {
    const options = {
      order: {
        timestamp: 'DESC'
      },
      limit: 1
    };
    const results = await this.jsonStorageService.query('statuses', options);
    return results.length > 0 ? new Date(results[0].timestamp) : null;
  }
}