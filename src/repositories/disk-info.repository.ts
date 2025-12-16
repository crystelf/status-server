import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { DiskInfoEntity } from '../entities';
import { JsonStorageService } from '../services';

@Injectable()
export class DiskInfoRepository {
  constructor(
    @Inject(forwardRef(() => JsonStorageService))
    private readonly jsonStorageService: JsonStorageService,
  ) {}

  /**
   * Save disk information for a client
   * Removes existing disk info for the client before saving new ones
   */
  async saveDiskInfos(clientId: string, diskInfos: any[]): Promise<void> {
    try {
      // Delete existing disk information
      await this.jsonStorageService.deleteMany('diskInfos', { clientId });

      // Save new disk information
      for (const disk of diskInfos) {
        await this.jsonStorageService.create('diskInfos', {
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
      return await this.jsonStorageService.findMany('diskInfos', { clientId });
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
      await this.jsonStorageService.deleteMany('diskInfos', { clientId });
    } catch (error) {
      console.error(`Failed to delete disk info for client ${clientId}:`, error);
      throw error;
    }
  }
}