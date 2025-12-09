import { Test, TestingModule } from '@nestjs/testing';
import { CleanupService } from './cleanup.service';
import { StatusRepository } from '../repositories';
import { ConfigService } from '../config';

describe('CleanupService', () => {
  let service: CleanupService;
  let statusRepository: jest.Mocked<StatusRepository>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    // Create mock repositories and services
    const mockStatusRepository = {
      deleteOldStatuses: jest.fn(),
      countAllStatusRecords: jest.fn(),
      findOldestStatusTimestamp: jest.fn(),
      findNewestStatusTimestamp: jest.fn(),
    };

    const mockConfigService = {
      getDataRetentionDays: jest.fn().mockReturnValue(30),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CleanupService,
        {
          provide: StatusRepository,
          useValue: mockStatusRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<CleanupService>(CleanupService);
    statusRepository = module.get(StatusRepository);
    configService = module.get(ConfigService);

    // Prevent automatic scheduling during tests
    jest.spyOn(service as any, 'startScheduledCleanup').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('cleanupOldData', () => {
    it('should delete old status records based on retention policy', async () => {
      // Arrange
      const retentionDays = 30;
      const deletedCount = 150;
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 60); // 60 days old - needs cleanup

      configService.getDataRetentionDays.mockReturnValue(retentionDays);
      statusRepository.deleteOldStatuses.mockResolvedValue(deletedCount);
      statusRepository.countAllStatusRecords
        .mockResolvedValueOnce(500) // First call in monitorStorage
        .mockResolvedValueOnce(350); // Second call after cleanup
      statusRepository.findOldestStatusTimestamp
        .mockResolvedValueOnce(oldDate) // First call in monitorStorage
        .mockResolvedValueOnce(new Date()); // Second call after cleanup
      statusRepository.findNewestStatusTimestamp.mockResolvedValue(new Date());

      // Act
      await service.cleanupOldData();

      // Assert
      expect(statusRepository.deleteOldStatuses).toHaveBeenCalledWith(expect.any(Date));

      // Verify the cutoff date is approximately 30 days ago
      const callArg = statusRepository.deleteOldStatuses.mock.calls[0][0];
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - retentionDays);

      // Allow 1 second tolerance for test execution time
      expect(Math.abs(callArg.getTime() - expectedDate.getTime())).toBeLessThan(1000);
    });

    it('should skip cleanup when no old data exists', async () => {
      // Arrange
      const retentionDays = 30;
      configService.getDataRetentionDays.mockReturnValue(retentionDays);
      statusRepository.countAllStatusRecords.mockResolvedValue(100);

      // Oldest record is within retention period
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 10); // 10 days old
      statusRepository.findOldestStatusTimestamp.mockResolvedValue(recentDate);
      statusRepository.findNewestStatusTimestamp.mockResolvedValue(new Date());

      // Act
      await service.cleanupOldData();

      // Assert - should not call delete since no cleanup is needed
      expect(statusRepository.deleteOldStatuses).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      const error = new Error('Database error');
      statusRepository.countAllStatusRecords.mockRejectedValue(error);

      // Act & Assert - should not throw
      await expect(service.cleanupOldData()).resolves.not.toThrow();
    });
  });

  describe('triggerCleanup', () => {
    it('should manually trigger cleanup and return deleted count', async () => {
      // Arrange
      const deletedCount = 75;
      configService.getDataRetentionDays.mockReturnValue(30);
      statusRepository.deleteOldStatuses.mockResolvedValue(deletedCount);

      // Act
      const result = await service.triggerCleanup();

      // Assert
      expect(result).toEqual({ deletedCount });
      expect(statusRepository.deleteOldStatuses).toHaveBeenCalled();
    });
  });

  describe('getStorageStats', () => {
    it('should return storage statistics', async () => {
      // Arrange
      const totalRecords = 1000;
      const retentionDays = 30;
      const oldestDate = new Date('2024-01-01');
      const newestDate = new Date('2024-12-09');

      configService.getDataRetentionDays.mockReturnValue(retentionDays);
      statusRepository.countAllStatusRecords.mockResolvedValue(totalRecords);
      statusRepository.findOldestStatusTimestamp.mockResolvedValue(oldestDate);
      statusRepository.findNewestStatusTimestamp.mockResolvedValue(newestDate);

      // Act
      const stats = await service.getStorageStats();

      // Assert
      expect(stats).toEqual({
        totalStatusRecords: totalRecords,
        retentionDays,
        oldestRecord: oldestDate,
        newestRecord: newestDate,
      });
    });
  });

  describe('monitorStorage', () => {
    it('should detect when cleanup is needed', async () => {
      // Arrange
      const retentionDays = 30;
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 60); // 60 days old

      configService.getDataRetentionDays.mockReturnValue(retentionDays);
      statusRepository.countAllStatusRecords.mockResolvedValue(500);
      statusRepository.findOldestStatusTimestamp.mockResolvedValue(oldDate);
      statusRepository.findNewestStatusTimestamp.mockResolvedValue(new Date());

      // Act
      const result = await service.monitorStorage();

      // Assert
      expect(result.needsCleanup).toBe(true);
      expect(result.totalRecords).toBe(500);
      expect(result.message).toContain('Cleanup recommended');
    });

    it('should report normal status when no cleanup needed', async () => {
      // Arrange
      const retentionDays = 30;
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 10); // 10 days old

      configService.getDataRetentionDays.mockReturnValue(retentionDays);
      statusRepository.countAllStatusRecords.mockResolvedValue(200);
      statusRepository.findOldestStatusTimestamp.mockResolvedValue(recentDate);
      statusRepository.findNewestStatusTimestamp.mockResolvedValue(new Date());

      // Act
      const result = await service.monitorStorage();

      // Assert
      expect(result.needsCleanup).toBe(false);
      expect(result.totalRecords).toBe(200);
      expect(result.message).toContain('within normal limits');
    });

    it('should handle case when no records exist', async () => {
      // Arrange
      configService.getDataRetentionDays.mockReturnValue(30);
      statusRepository.countAllStatusRecords.mockResolvedValue(0);
      statusRepository.findOldestStatusTimestamp.mockResolvedValue(null);
      statusRepository.findNewestStatusTimestamp.mockResolvedValue(null);

      // Act
      const result = await service.monitorStorage();

      // Assert
      expect(result.needsCleanup).toBe(false);
      expect(result.totalRecords).toBe(0);
    });
  });
});
