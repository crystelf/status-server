import { Injectable, Logger } from '@nestjs/common';
import { ClientRepository } from '../repositories';
import { StatusRepository } from '../repositories';
import { DiskInfoRepository } from '../repositories';
import { DiskUsageRepository } from '../repositories';
import { ReportPayloadDto } from '../dto';
import { ClientSummaryDto } from '../dto';
import { ClientDetailDto } from '../dto';
import { DynamicSystemStatus } from '../dto';
import { DiskUsage } from '../dto';
import { ClientEntity } from '../entities';
import { StatusEntity } from '../entities';

@Injectable()
export class ClientService {
  private readonly logger = new Logger(ClientService.name);

  constructor(
    private readonly clientRepository: ClientRepository,
    private readonly statusRepository: StatusRepository,
    private readonly diskInfoRepository: DiskInfoRepository,
    private readonly diskUsageRepository: DiskUsageRepository,
  ) {}

  /**
   * Save client report data
   */
  async saveReport(payload: ReportPayloadDto): Promise<void> {
    try {
      // Upsert client information
      const clientEntity: Partial<ClientEntity> = {
        id: payload.clientId,
        name: payload.clientName,
        tags: JSON.stringify(payload.clientTags),
        purpose: payload.clientPurpose,
        hostname: payload.hostname,
        platform: payload.platform,
        cpuModel: payload.staticInfo.cpuModel,
        cpuCores: payload.staticInfo.cpuCores,
        cpuArch: payload.staticInfo.cpuArch,
        systemVersion: payload.staticInfo.systemVersion,
        systemModel: payload.staticInfo.systemModel,
        totalMemory: payload.staticInfo.totalMemory,
        totalSwap: payload.staticInfo.totalSwap,
        totalDisk: payload.staticInfo.totalDisk,
        location: payload.staticInfo.location,
        updatedAt: new Date(),
      };

      await this.clientRepository.upsertClient(clientEntity);

      // Save status record
      const statusEntity: Partial<StatusEntity> = {
        clientId: payload.clientId,
        cpuUsage: payload.dynamicStatus.cpuUsage,
        cpuFrequency: payload.dynamicStatus.cpuFrequency,
        memoryUsage: payload.dynamicStatus.memoryUsage,
        swapUsage: payload.dynamicStatus.swapUsage,
        diskUsage: payload.dynamicStatus.diskUsage,
        networkUpload: payload.dynamicStatus.networkUpload,
        networkDownload: payload.dynamicStatus.networkDownload,
        timestamp: new Date(payload.dynamicStatus.timestamp),
      };

      await this.statusRepository.saveStatus(statusEntity);

      // Save disk information
      await this.diskInfoRepository.saveDiskInfos(payload.clientId, payload.staticInfo.disks);

      // Save disk usage
      await this.diskUsageRepository.saveDiskUsages(payload.clientId, payload.dynamicStatus.diskUsages);

      this.logger.log(`Report saved for client ${payload.clientId}`);
    } catch (error) {
      this.logger.error(`Failed to save report for client ${payload.clientId}`, error);
      throw error;
    }
  }

  /**
   * Get all clients
   */
  async getAllClients(): Promise<ClientSummaryDto[]> {
    try {
      const clients = await this.clientRepository.findAllClients();

      const summaries: ClientSummaryDto[] = await Promise.all(
        clients.map(async (client) => {
          const status = this.determineClientStatus(client.updatedAt);

          return {
            clientId: client.id,
            clientName: client.name,
            clientTags: JSON.parse(client.tags),
            clientPurpose: client.purpose || '',
            hostname: client.hostname,
            platform: client.platform,
            status,
            lastUpdate: client.updatedAt.getTime(),
          };
        }),
      );

      return summaries;
    } catch (error) {
      this.logger.error('Failed to get all clients', error);
      throw error;
    }
  }

  /**
   * Get client by ID with detailed information
   */
  async getClientById(id: string): Promise<ClientDetailDto | null> {
    try {
      const client = await this.clientRepository.findClientById(id);

      if (!client) {
        return null;
      }

      const latestStatus = await this.statusRepository.findLatestStatus(id);

      if (!latestStatus) {
        return null;
      }

      // Get disk information
      const diskInfos = await this.diskInfoRepository.getDiskInfosByClientId(id);
      
      // Get latest disk usage
      const diskUsages = await this.diskUsageRepository.getLatestDiskUsage(id);

      const status = this.determineClientStatus(client.updatedAt);

      const detail: ClientDetailDto = {
        clientId: client.id,
        clientName: client.name,
        clientTags: JSON.parse(client.tags),
        clientPurpose: client.purpose || '',
        hostname: client.hostname,
        platform: client.platform,
        status,
        lastUpdate: client.updatedAt.getTime(),
        staticInfo: {
          cpuModel: client.cpuModel || '',
          cpuCores: client.cpuCores || 0,
          cpuArch: client.cpuArch || '',
          systemVersion: client.systemVersion || '',
          systemModel: client.systemModel || '',
          totalMemory: client.totalMemory || 0,
          totalSwap: client.totalSwap || 0,
          totalDisk: client.totalDisk || 0,
          disks: diskInfos.map(disk => ({
            device: disk.device,
            size: disk.size,
            type: disk.type,
            interfaceType: disk.interfaceType,
          })),
          location: client.location || '',
        },
        currentStatus: {
          cpuUsage: Number(latestStatus.cpuUsage),
          cpuFrequency: Number(latestStatus.cpuFrequency),
          memoryUsage: Number(latestStatus.memoryUsage),
          swapUsage: Number(latestStatus.swapUsage),
          diskUsage: Number(latestStatus.diskUsage),
          diskUsages: diskUsages.map(disk => ({
            device: disk.device,
            size: disk.size,
            used: disk.used,
            available: disk.available,
            usagePercent: Number(disk.usagePercent),
            mountpoint: disk.mountpoint,
          })),
          networkUpload: Number(latestStatus.networkUpload),
          networkDownload: Number(latestStatus.networkDownload),
          timestamp: latestStatus.timestamp.getTime(),
        },
      };

      return detail;
    } catch (error) {
      this.logger.error(`Failed to get client ${id}`, error);
      throw error;
    }
  }

  /**
   * Get client history data
   */
  async getClientHistory(
    id: string,
    startTime: number,
    endTime: number,
  ): Promise<DynamicSystemStatus[]> {
    try {
      const startDate = new Date(startTime);
      const endDate = new Date(endTime);

      const statusRecords = await this.statusRepository.findStatusHistory(id, startDate, endDate);
      
      // Get disk usage history for the same time period
      const diskUsageHistory = await this.diskUsageRepository.getDiskUsageHistory(id, startDate, endDate);
      
      // Group disk usage by timestamp
      const diskUsageByTimestamp = new Map<number, DiskUsage[]>();
      diskUsageHistory.forEach(disk => {
        const timestamp = disk.timestamp.getTime();
        if (!diskUsageByTimestamp.has(timestamp)) {
          diskUsageByTimestamp.set(timestamp, []);
        }
        diskUsageByTimestamp.get(timestamp)!.push({
          device: disk.device,
          size: disk.size,
          used: disk.used,
          available: disk.available,
          usagePercent: Number(disk.usagePercent),
          mountpoint: disk.mountpoint,
        });
      });

      const history: DynamicSystemStatus[] = statusRecords.map((record) => {
        const timestamp = record.timestamp.getTime();
        return {
          cpuUsage: Number(record.cpuUsage),
          cpuFrequency: Number(record.cpuFrequency),
          memoryUsage: Number(record.memoryUsage),
          swapUsage: Number(record.swapUsage),
          diskUsage: Number(record.diskUsage),
          networkUpload: Number(record.networkUpload),
          networkDownload: Number(record.networkDownload),
          diskUsages: diskUsageByTimestamp.get(timestamp) || [],
          timestamp: timestamp,
        };
      });

      return history;
    } catch (error) {
      this.logger.error(`Failed to get history for client ${id}`, error);
      throw error;
    }
  }

  /**
   * Mark offline clients based on timeout
   * Note: This method determines status dynamically based on lastUpdate time
   * The actual status is computed in real-time when fetching clients
   */
  async markOfflineClients(timeoutMs: number): Promise<void> {
    // This is a no-op since we determine status dynamically
    // The status is calculated in getAllClients and getClientById
    // based on the updatedAt timestamp
    this.logger.log(`Offline check with timeout ${timeoutMs}ms`);
  }

  /**
   * Determine if a client is online or offline based on last update time
   * Default timeout: 5 minutes (300000ms)
   */
  private determineClientStatus(
    lastUpdate: Date,
    timeoutMs: number = 300000,
  ): 'online' | 'offline' {
    const now = new Date().getTime();
    const lastUpdateTime = lastUpdate.getTime();
    const timeDiff = now - lastUpdateTime;

    return timeDiff <= timeoutMs ? 'online' : 'offline';
  }
}
