import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { DiskInfoEntity } from '../entities';

@Injectable()
export class DiskInfoRepository {
  constructor(
    @InjectRepository(DiskInfoEntity)
    private readonly diskInfoRepository: Repository<DiskInfoEntity>,
  ) {}

  /**
   * Save disk information for a client
   * Removes existing disk info for the client before saving new ones
   */
  async saveDiskInfos(clientId: string, diskInfos: any[]): Promise<void> {
    try {
      // Delete existing disk information
      await this.diskInfoRepository.delete({ clientId });

      // Save new disk information
      for (const disk of diskInfos) {
        await this.diskInfoRepository.save({
          clientId,
          device: disk.device,
          size: disk.size,
          type: disk.type,
          interfaceType: disk.interfaceType,
        });
      }
    } catch (error) {
      console.error(`Failed to save disk info for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Get disk information by client ID
   */
  async getDiskInfosByClientId(clientId: string): Promise<DiskInfoEntity[]> {
    try {
      return this.diskInfoRepository.findBy({ clientId });
    } catch (error) {
      console.error(`Failed to get disk info for client ${clientId}:`, error);
      throw error;
    }
  }

  /**
   * Delete disk information for a client
   */
  async deleteDiskInfosByClientId(clientId: string): Promise<void> {
    try {
      await this.diskInfoRepository.delete({ clientId });
    } catch (error) {
      console.error(`Failed to delete disk info for client ${clientId}:`, error);
      throw error;
    }
  }
}