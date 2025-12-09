import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ValidationService } from './validation.service';

describe('ValidationService', () => {
  let service: ValidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ValidationService],
    }).compile();

    service = module.get<ValidationService>(ValidationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateReportPayload', () => {
    const validPayload = {
      clientId: 'test-client-1',
      clientName: 'Test Client',
      clientTags: ['tag1', 'tag2'],
      clientPurpose: 'Testing',
      hostname: 'test-host',
      platform: 'linux',
      staticInfo: {
        cpuModel: 'Intel Core i7',
        cpuCores: 8,
        cpuArch: 'x86_64',
        systemVersion: 'Ubuntu 22.04',
        systemModel: 'Virtual Machine',
        totalMemory: 16000000000,
        totalSwap: 8000000000,
        totalDisk: 500000000000,
        diskType: 'SSD',
        location: 'US-East',
      },
      dynamicStatus: {
        cpuUsage: 45.5,
        cpuFrequency: 3.2,
        memoryUsage: 60.0,
        swapUsage: 10.0,
        diskUsage: 70.0,
        networkUpload: 1000000,
        networkDownload: 5000000,
        timestamp: Date.now(),
      },
    };

    it('should validate a correct payload', () => {
      expect(() => service.validateReportPayload(validPayload)).not.toThrow();
    });

    it('should throw error if clientId is missing', () => {
      const invalidPayload = { ...validPayload, clientId: undefined };
      expect(() => service.validateReportPayload(invalidPayload)).toThrow(BadRequestException);
    });

    it('should throw error if clientName is missing', () => {
      const invalidPayload = { ...validPayload, clientName: undefined };
      expect(() => service.validateReportPayload(invalidPayload)).toThrow(BadRequestException);
    });

    it('should throw error if clientTags is not an array', () => {
      const invalidPayload = { ...validPayload, clientTags: 'not-an-array' };
      expect(() => service.validateReportPayload(invalidPayload)).toThrow(BadRequestException);
    });

    it('should throw error if staticInfo is missing', () => {
      const invalidPayload = { ...validPayload, staticInfo: undefined };
      expect(() => service.validateReportPayload(invalidPayload)).toThrow(BadRequestException);
    });

    it('should throw error if dynamicStatus is missing', () => {
      const invalidPayload = { ...validPayload, dynamicStatus: undefined };
      expect(() => service.validateReportPayload(invalidPayload)).toThrow(BadRequestException);
    });

    it('should throw error if cpuUsage is out of range', () => {
      const invalidPayload = {
        ...validPayload,
        dynamicStatus: { ...validPayload.dynamicStatus, cpuUsage: 150 },
      };
      expect(() => service.validateReportPayload(invalidPayload)).toThrow(BadRequestException);
    });

    it('should throw error if cpuCores is not positive', () => {
      const invalidPayload = {
        ...validPayload,
        staticInfo: { ...validPayload.staticInfo, cpuCores: 0 },
      };
      expect(() => service.validateReportPayload(invalidPayload)).toThrow(BadRequestException);
    });

    it('should throw error if timestamp is invalid', () => {
      const invalidPayload = {
        ...validPayload,
        dynamicStatus: { ...validPayload.dynamicStatus, timestamp: -1 },
      };
      expect(() => service.validateReportPayload(invalidPayload)).toThrow(BadRequestException);
    });
  });

  describe('validateHistoryQuery', () => {
    it('should validate correct query parameters', () => {
      expect(() =>
        service.validateHistoryQuery('client-1', 1000000, 2000000),
      ).not.toThrow();
    });

    it('should throw error if clientId is missing', () => {
      expect(() => service.validateHistoryQuery('', 1000000, 2000000)).toThrow(
        BadRequestException,
      );
    });

    it('should throw error if startTime is invalid', () => {
      expect(() => service.validateHistoryQuery('client-1', 'invalid', 2000000)).toThrow(
        BadRequestException,
      );
    });

    it('should throw error if endTime is invalid', () => {
      expect(() => service.validateHistoryQuery('client-1', 1000000, 'invalid')).toThrow(
        BadRequestException,
      );
    });

    it('should throw error if startTime >= endTime', () => {
      expect(() => service.validateHistoryQuery('client-1', 2000000, 1000000)).toThrow(
        BadRequestException,
      );
    });
  });
});
