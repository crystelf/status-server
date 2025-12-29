import { Injectable } from '@nestjs/common';
import { Repository, Between, LessThan } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { StatusEntity } from '../entities';

@Injectable()
export class StatusRepository {
  constructor(
    @InjectRepository(StatusEntity)
    private readonly statusRepository: Repository<StatusEntity>,
  ) {}

  /**
   * Save a new status record
   */
  async saveStatus(status: Partial<StatusEntity>): Promise<StatusEntity> {
    return this.statusRepository.save(status);
  }

  /**
   * Find status history for a client within a time range
   */
  async findStatusHistory(
    clientId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<StatusEntity[]> {
    return this.statusRepository.find({
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
  async findLatestStatus(clientId: string): Promise<StatusEntity | null> {
    return this.statusRepository.findOne({
      where: { clientId },
      order: {
        timestamp: 'DESC',
      },
    });
  }

  /**
   * Delete old status records before a certain date
   */
  async deleteOldStatuses(beforeDate: Date): Promise<number> {
    const result = await this.statusRepository.delete({
      timestamp: LessThan(beforeDate),
    });
    return result.affected || 0;
  }

  /**
   * Count status records for a client
   */
  async countStatusRecords(clientId: string): Promise<number> {
    return this.statusRepository.countBy({ clientId });
  }

  /**
   * Count all status records across all clients
   */
  async countAllStatusRecords(): Promise<number> {
    return this.statusRepository.count();
  }

  /**
   * Find the oldest status timestamp across all clients
   */
  async findOldestStatusTimestamp(): Promise<Date | null> {
    const oldestStatus = await this.statusRepository.findOne({
      order: {
        timestamp: 'ASC',
      },
      select: ['timestamp'],
    });
    return oldestStatus?.timestamp || null;
  }

  /**
   * Find the newest status timestamp across all clients
   */
  async findNewestStatusTimestamp(): Promise<Date | null> {
    const newestStatus = await this.statusRepository.findOne({
      order: {
        timestamp: 'DESC',
      },
      select: ['timestamp'],
    });
    return newestStatus?.timestamp || null;
  }
}