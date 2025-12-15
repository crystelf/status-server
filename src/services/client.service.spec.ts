import { Test, TestingModule } from '@nestjs/testing';
import { ClientService } from './client.service';
import { ClientRepository } from '../repositories';
import { StatusRepository } from '../repositories';
import { ReportPayloadDto } from '../dto';

describe('ClientService', () => {
  let service: ClientService;
  let clientRepository: jest.Mocked<ClientRepository>;
  let statusRepository: jest.Mocked<StatusRepository>;

  beforeEach(async () => {
    const mockClientRepository = {
      upsertClient: jest.fn(),
      findAllClients: jest.fn(),
      findClientById: jest.fn(),
    };

    const mockStatusRepository = {
      saveStatus: jest.fn(),
      findLatestStatus: jest.fn(),
      findStatusHistory: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientService,
        {
          provide: ClientRepository,
          useValue: mockClientRepository,
        },
        {
          provide: StatusRepository,
          useValue: mockStatusRepository,
        },
      ],
    }).compile();

    service = module.get<ClientService>(ClientService);
    clientRepository = module.get(ClientRepository);
    statusRepository = module.get(StatusRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('saveReport', () => {
    it('should save client and status data', async () => {
      const payload: ReportPayloadDto = {
        clientId: 'test-client-1',
        clientName: 'Test Client',
        clientTags: ['production', 'web'],
        clientPurpose: 'Web Server',
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
          disks: [
            {
              device: '/dev/sda',
              size: 500000000000,
              type: 'SSD',
              interfaceType: 'SATA',
            }
          ],
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
          diskUsages: [
            {
              device: '/dev/sda1',
              size: 500000000000,
              used: 350000000000,
              available: 150000000000,
              usagePercent: 70.0,
              mountpoint: '/',
            }
          ],
          timestamp: Date.now(),
        },
      };

      await service.saveReport(payload);

      expect(clientRepository.upsertClient).toHaveBeenCalledWith(
        expect.objectContaining({
          id: payload.clientId,
          name: payload.clientName,
          hostname: payload.hostname,
        }),
      );

      expect(statusRepository.saveStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          clientId: payload.clientId,
          cpuUsage: payload.dynamicStatus.cpuUsage,
        }),
      );
    });
  });

  describe('getAllClients', () => {
    it('should return all clients with status', async () => {
      const mockClients = [
        {
          id: 'client-1',
          name: 'Client 1',
          tags: '["tag1", "tag2"]',
          purpose: 'Test',
          hostname: 'host1',
          platform: 'linux',
          updatedAt: new Date(),
        },
      ];

      clientRepository.findAllClients.mockResolvedValue(mockClients as any);

      const result = await service.getAllClients();

      expect(result).toHaveLength(1);
      expect(result[0].clientId).toBe('client-1');
      expect(result[0].clientTags).toEqual(['tag1', 'tag2']);
    });
  });

  describe('getClientById', () => {
    it('should return client detail with latest status', async () => {
      const mockClient = {
        id: 'client-1',
        name: 'Client 1',
        tags: '["tag1"]',
        purpose: 'Test',
        hostname: 'host1',
        platform: 'linux',
        cpuModel: 'Intel',
        cpuCores: 4,
        cpuArch: 'x86_64',
        systemVersion: 'Ubuntu',
        systemModel: 'VM',
        totalMemory: 8000000000,
        totalSwap: 4000000000,
        totalDisk: 100000000000,
        diskType: 'SSD',
        location: 'US',
        updatedAt: new Date(),
      };

      const mockStatus = {
        cpuUsage: 50,
        cpuFrequency: 3.0,
        memoryUsage: 60,
        swapUsage: 10,
        diskUsage: 70,
        networkUpload: 1000000,
        networkDownload: 2000000,
        timestamp: new Date(),
      };

      clientRepository.findClientById.mockResolvedValue(mockClient as any);
      statusRepository.findLatestStatus.mockResolvedValue(mockStatus as any);

      const result = await service.getClientById('client-1');

      expect(result).toBeDefined();
      expect(result?.clientId).toBe('client-1');
      expect(result?.staticInfo.cpuModel).toBe('Intel');
      expect(result?.currentStatus.cpuUsage).toBe(50);
    });

    it('should return null if client not found', async () => {
      clientRepository.findClientById.mockResolvedValue(null);

      const result = await service.getClientById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getClientHistory', () => {
    it('should return history data within time range', async () => {
      const mockHistory = [
        {
          cpuUsage: 50,
          cpuFrequency: 3.0,
          memoryUsage: 60,
          swapUsage: 10,
          diskUsage: 70,
          networkUpload: 1000000,
          networkDownload: 2000000,
          timestamp: new Date(),
        },
      ];

      statusRepository.findStatusHistory.mockResolvedValue(mockHistory as any);

      const startTime = Date.now() - 3600000;
      const endTime = Date.now();

      const result = await service.getClientHistory('client-1', startTime, endTime);

      expect(result).toHaveLength(1);
      expect(result[0].cpuUsage).toBe(50);
    });
  });
});
