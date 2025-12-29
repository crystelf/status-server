import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigEntity } from '../entities';

@Injectable()
export class ConfigRepository {
  constructor(
    @InjectRepository(ConfigEntity)
    private readonly configRepository: Repository<ConfigEntity>,
  ) {}

  /**
   * Get a config value by key
   */
  async getConfig(key: string): Promise<string | null> {
    const config = await this.configRepository.findOneBy({ key });
    return config?.value || null;
  }

  /**
   * Set a config value
   */
  async setConfig(key: string, value: string): Promise<void> {
    await this.configRepository.save({ key, value });
  }

  /**
   * Delete a config value
   */
  async deleteConfig(key: string): Promise<void> {
    await this.configRepository.delete({ key });
  }

  /**
   * Get all config values
   */
  async getAllConfigs(): Promise<ConfigEntity[]> {
    return this.configRepository.find();
  }
}