import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Between } from 'typeorm';
import { StatusEntity } from '../entities';
import { DatabaseRetry } from '../utils';

@Injectable()
export class StatusRepository {
  constructor(
    @InjectRepository(StatusEntity)
    private readonly repository: Repository<StatusEntity>,
  ) {}

  /**
   * Save a new status record
   */
  @DatabaseRetry()
  async saveStatus(status: Partial<StatusEntity>): Promise<StatusEntity> {
    const entity = this.repository.create(status);
    return this.repository.save(entity);
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
    return this.repository.find({
      where: {
        clientId,
        timestamp: Between(startTime, endTime),
      },
      order: {
        timestamp: 'ASC',
      },
    });
  }

  /**
   * Find the latest status for a client
   */
  @DatabaseRetry()
  async findLatestStatus(clientId: string): Promise<StatusEntity | null> {
    return this.repository.findOne({
      where: { clientId },
      order: {
        timestamp: 'DESC',
      },
    });
  }

  /**
   * Delete old status records before a certain date
   */
  @DatabaseRetry()
  async deleteOldStatuses(beforeDate: Date): Promise<number> {
    const result = await this.repository.delete({
      timestamp: LessThan(beforeDate),
    });
    return result.affected || 0;
  }

  /**
   * Count status records for a client
   */
  @DatabaseRetry()
  async countStatusRecords(clientId: string): Promise<number> {
    return this.repository.count({
      where: { clientId },
    });
  }

  /**
   * Count all status records across all clients
   */
  @DatabaseRetry()
  async countAllStatusRecords(): Promise<number> {
    return this.repository.count();
  }

  /**
   * Find the oldest status timestamp across all clients
   */
  @DatabaseRetry()
  async findOldestStatusTimestamp(): Promise<Date | null> {
    const result = await this.repository.findOne({
      order: {
        timestamp: 'ASC',
      },
    });
    return result ? result.timestamp : null;
  }

  /**
   * Find the newest status timestamp across all clients
   */
  @DatabaseRetry()
  async findNewestStatusTimestamp(): Promise<Date | null> {
    const result = await this.repository.findOne({
      order: {
        timestamp: 'DESC',
      },
    });
    return result ? result.timestamp : null;
  }
}
