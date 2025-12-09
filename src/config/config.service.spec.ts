import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from './config.service';
import { ConfigRepository } from '../repositories';
import { DEFAULT_SERVER_CONFIG } from './server-config.interface';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';

describe('ConfigService', () => {
  let service: ConfigService;
  const testConfigPath = join(process.cwd(), 'config.json');

  // Mock ConfigRepository
  const mockConfigRepository = {
    initializeDefaults: jest.fn().mockResolvedValue(undefined),
    setConfig: jest.fn().mockResolvedValue(undefined),
    getConfig: jest.fn().mockResolvedValue(null),
  };

  beforeEach(async () => {
    // Clean up any existing config file
    if (existsSync(testConfigPath)) {
      unlinkSync(testConfigPath);
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigService,
        {
          provide: ConfigRepository,
          useValue: mockConfigRepository,
        },
      ],
    }).compile();

    service = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    // Clean up test config file
    if (existsSync(testConfigPath)) {
      unlinkSync(testConfigPath);
    }
    jest.clearAllMocks();
  });

  describe('Configuration Loading', () => {
    it('should use default configuration when config.json does not exist', async () => {
      await service.onModuleInit();

      const config = service.getConfig();
      expect(config.port).toBe(DEFAULT_SERVER_CONFIG.port);
      expect(config.dataRetentionDays).toBe(DEFAULT_SERVER_CONFIG.dataRetentionDays);
      expect(config.databasePath).toBe(DEFAULT_SERVER_CONFIG.databasePath);
    });

    it('should load configuration from config.json when it exists', async () => {
      const customConfig = {
        port: 4000,
        dataRetentionDays: 60,
        databasePath: 'custom/path.db',
      };

      writeFileSync(testConfigPath, JSON.stringify(customConfig, null, 2));

      await service.onModuleInit();

      const config = service.getConfig();
      expect(config.port).toBe(4000);
      expect(config.dataRetentionDays).toBe(60);
      expect(config.databasePath).toBe('custom/path.db');
    });

    it('should use defaults for missing fields in config.json', async () => {
      const partialConfig = {
        port: 5000,
      };

      writeFileSync(testConfigPath, JSON.stringify(partialConfig, null, 2));

      await service.onModuleInit();

      const config = service.getConfig();
      expect(config.port).toBe(5000);
      expect(config.dataRetentionDays).toBe(DEFAULT_SERVER_CONFIG.dataRetentionDays);
      expect(config.databasePath).toBe(DEFAULT_SERVER_CONFIG.databasePath);
    });

    it('should use defaults when config.json is invalid JSON', async () => {
      writeFileSync(testConfigPath, 'invalid json content');

      await service.onModuleInit();

      const config = service.getConfig();
      expect(config.port).toBe(DEFAULT_SERVER_CONFIG.port);
      expect(config.dataRetentionDays).toBe(DEFAULT_SERVER_CONFIG.dataRetentionDays);
    });
  });

  describe('Configuration Getters', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should return port number', () => {
      expect(service.getPort()).toBe(DEFAULT_SERVER_CONFIG.port);
    });

    it('should return data retention days', () => {
      expect(service.getDataRetentionDays()).toBe(DEFAULT_SERVER_CONFIG.dataRetentionDays);
    });

    it('should return database path', () => {
      expect(service.getDatabasePath()).toBe(DEFAULT_SERVER_CONFIG.databasePath);
    });

    it('should return a copy of config object', () => {
      const config1 = service.getConfig();
      const config2 = service.getConfig();
      expect(config1).toEqual(config2);
      expect(config1).not.toBe(config2); // Different object references
    });
  });

  describe('Database Configuration Sync', () => {
    it('should initialize database defaults on module init', async () => {
      await service.onModuleInit();

      expect(mockConfigRepository.initializeDefaults).toHaveBeenCalled();
      expect(mockConfigRepository.setConfig).toHaveBeenCalledWith(
        'data_retention_days',
        DEFAULT_SERVER_CONFIG.dataRetentionDays.toString(),
      );
    });

    it('should sync custom data retention days to database', async () => {
      const customConfig = {
        port: 7788,
        dataRetentionDays: 45,
      };

      writeFileSync(testConfigPath, JSON.stringify(customConfig, null, 2));

      await service.onModuleInit();

      expect(mockConfigRepository.setConfig).toHaveBeenCalledWith('data_retention_days', '45');
    });
  });

  describe('Runtime Configuration Updates', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should update data retention days at runtime', async () => {
      await service.updateDataRetentionDays(90);

      expect(service.getDataRetentionDays()).toBe(90);
      expect(mockConfigRepository.setConfig).toHaveBeenCalledWith('data_retention_days', '90');
    });

    it('should reject invalid data retention days', async () => {
      await expect(service.updateDataRetentionDays(0)).rejects.toThrow(
        'Data retention days must be at least 1',
      );
      await expect(service.updateDataRetentionDays(-5)).rejects.toThrow(
        'Data retention days must be at least 1',
      );
    });
  });

  describe('Default Values (Requirement 6.6)', () => {
    it('should default to 30 days data retention', async () => {
      await service.onModuleInit();
      expect(service.getDataRetentionDays()).toBe(30);
    });

    it('should default to port 7788', async () => {
      await service.onModuleInit();
      expect(service.getPort()).toBe(7788);
    });
  });
});
