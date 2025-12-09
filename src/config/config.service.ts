import { Injectable, OnModuleInit } from '@nestjs/common';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { ServerConfig, DEFAULT_SERVER_CONFIG } from './server-config.interface';
import { ConfigRepository } from '../repositories';

/**
 * Service for managing server configuration
 * Reads from config.json file and database
 */
@Injectable()
export class ConfigService implements OnModuleInit {
  private config: ServerConfig;

  constructor(private readonly configRepository: ConfigRepository) {
    this.config = { ...DEFAULT_SERVER_CONFIG };
  }

  /**
   * Initialize configuration on module startup
   */
  async onModuleInit() {
    this.loadConfig();
    await this.initializeDatabaseConfig();
  }

  /**
   * Load configuration from config.json file
   * Falls back to defaults if file doesn't exist or fields are missing
   */
  private loadConfig(): void {
    const configPath = join(process.cwd(), 'config.json');

    if (existsSync(configPath)) {
      try {
        const fileContent = readFileSync(configPath, 'utf-8');
        const fileConfig = JSON.parse(fileContent);

        // Merge with defaults, file config takes precedence
        this.config = {
          port: fileConfig.port ?? DEFAULT_SERVER_CONFIG.port,
          dataRetentionDays:
            fileConfig.dataRetentionDays ?? DEFAULT_SERVER_CONFIG.dataRetentionDays,
          databasePath: fileConfig.databasePath ?? DEFAULT_SERVER_CONFIG.databasePath,
        };

        console.log('Configuration loaded from config.json');
      } catch (error) {
        console.warn('Failed to load config.json, using defaults:', error.message);
        this.config = { ...DEFAULT_SERVER_CONFIG };
      }
    } else {
      console.log('config.json not found, using default configuration');
      this.config = { ...DEFAULT_SERVER_CONFIG };
    }
  }

  /**
   * Initialize database configuration with defaults
   */
  private async initializeDatabaseConfig(): Promise<void> {
    try {
      await this.configRepository.initializeDefaults();

      // Sync data retention days to database
      await this.configRepository.setConfig(
        'data_retention_days',
        this.config.dataRetentionDays.toString(),
      );
    } catch (error) {
      console.error('Failed to initialize database config:', error.message);
    }
  }

  /**
   * Get the current server configuration
   */
  getConfig(): ServerConfig {
    return { ...this.config };
  }

  /**
   * Get the port number
   */
  getPort(): number {
    return this.config.port;
  }

  /**
   * Get the data retention days
   */
  getDataRetentionDays(): number {
    return this.config.dataRetentionDays;
  }

  /**
   * Get database path
   */
  getDatabasePath(): string {
    return this.config.databasePath || DEFAULT_SERVER_CONFIG.databasePath!;
  }

  /**
   * Update data retention days (runtime update)
   */
  async updateDataRetentionDays(days: number): Promise<void> {
    if (days < 1) {
      throw new Error('Data retention days must be at least 1');
    }

    this.config.dataRetentionDays = days;
    await this.configRepository.setConfig('data_retention_days', days.toString());
  }
}
