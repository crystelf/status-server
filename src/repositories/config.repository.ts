import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { ConfigEntity } from '../entities';
import { DatabaseRetry } from '../utils';
import { JsonStorageService } from '../services';

@Injectable()
export class ConfigRepository {
  constructor(
    @Inject(forwardRef(() => JsonStorageService))
    private readonly jsonStorageService: JsonStorageService,
  ) {}

  /**
   * Get a config value by key
   */
  @DatabaseRetry()
  async getConfig(key: string): Promise<string | null> {
    const config = await this.jsonStorageService.findOne('configs', key);
    return config?.value || null;
  }

  /**
   * Set a config value
   */
  @DatabaseRetry()
  async setConfig(key: string, value: string): Promise<void> {
    const existingConfig = await this.jsonStorageService.findOne('configs', key);
    if (existingConfig) {
      await this.jsonStorageService.update('configs', key, { value });
    } else {
      await this.jsonStorageService.create('configs', { key, value });
    }
  }

  /**
   * Delete a config value
   */
  @DatabaseRetry()
  async deleteConfig(key: string): Promise<void> {
    await this.jsonStorageService.delete('configs', key);
  }

  /**
   * Get all config values
   */
  @DatabaseRetry()
  async getAllConfigs(): Promise<ConfigEntity[]> {
    return await this.jsonStorageService.findAll('configs');
  }
}