import { Injectable } from '@nestjs/common';
import { Repository, Between, LessThan } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { DiskUsageEntity } from '../entities';

@Injectable()
export class DiskUsageRepository {
  constructor(
    @InjectRepository(DiskUsageEntity)
    private readonly diskUsageRepository: Repository<DiskUsageEntity>,
  ) {}

  /**
   * Save disk usage for a client
   */
  async saveDiskUsages(clientId: string, diskUsages: any[]): Promise<void> {
    try {
      const diskUsageEntities = diskUsages.map(disk => ({
        clientId,
        device: disk.device,
        size: disk.size,
        used: disk.used,
        available: disk.available,
        usagePercent: disk.usagePercent,
        mountpoint: disk.mountpoint,
        timestamp: new Date(),
      }));
      
      await this.diskUsageRepository.save(diskUsageEntities);
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
      // Use a query builder to get the latest record per device
      const subQuery = this.diskUsageRepository.createQueryBuilder('du')
        .select('du.device, MAX(du.timestamp) as maxTimestamp')
        .where('du.clientId = :clientId', { clientId })
        .groupBy('du.device');

      return this.diskUsageRepository.createQueryBuilder('du')
        .innerJoin(
          `(${subQuery.getQuery()})`,
          'latest',
          'du.device = latest.device AND du.timestamp = latest.maxTimestamp'
        )
        .setParameter('clientId', clientId)
        .getMany();
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
      return this.diskUsageRepository.find({
        where: {
          clientId,
          timestamp: Between(startTime, endTime),
        },
        order: {
          timestamp: 'ASC',
        },
      });
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
      const result = await this.diskUsageRepository.delete({
        timestamp: LessThan(beforeDate),
      });
      return result.affected || 0;
    } catch (error) {
      console.error('Failed to delete old disk usage records:', error);
      throw error;
    }
  }
}