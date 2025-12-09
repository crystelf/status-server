import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigEntity } from '../entities';
import { DatabaseRetry } from '../utils';

@Injectable()
export class ConfigRepository {
  constructor(
    @InjectRepository(ConfigEntity)
    private readonly repository: Repository<ConfigEntity>,
  ) {}

  /**
   * Get a config value by key
   */
  @DatabaseRetry()
  async getConfig(key: string): Promise<string | null> {
    const config = await this.repository.findOne({
      where: { key },
    });
    return config?.value || null;
  }

  /**
   * Set a config value
   */
  @DatabaseRetry()
  async setConfig(key: string, value: string): Promise<void> {
    await this.repository.save({ key, value });
  }

  /**
   * Get all config entries
   */
  @DatabaseRetry()
  async getAllConfig(): Promise<ConfigEntity[]> {
    return this.repository.find();
  }

  /**
   * Initialize default config if not exists
   */
  @DatabaseRetry()
  async initializeDefaults(): Promise<void> {
    const dataRetentionDays = await this.getConfig('data_retention_days');
    if (!dataRetentionDays) {
      await this.setConfig('data_retention_days', '30');
    }
  }
}
