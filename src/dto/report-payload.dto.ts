export interface DiskInfo {
  device: string;
  size: number;
  type: string;
  interfaceType?: string;
}

export interface DiskUsage {
  device: string;
  size: number;
  used: number;
  available: number;
  usagePercent: number;
  mountpoint?: string;
}

export interface StaticSystemInfo {
  cpuModel: string;
  cpuCores: number;
  cpuArch: string;
  systemVersion: string;
  systemModel: string;
  totalMemory: number;
  totalSwap: number;
  totalDisk: number;
  disks: DiskInfo[];
  location: string;
  timezone: string;
}

export interface DynamicSystemStatus {
  cpuUsage: number;
  cpuFrequency: number;
  memoryUsage: number;
  swapUsage: number;
  diskUsage: number;
  diskUsages: DiskUsage[];
  networkUpload: number;
  networkDownload: number;
  timestamp: number;
}

export interface ReportPayloadDto {
  clientId: string;
  clientName: string;
  clientTags: string[];
  clientPurpose: string;
  hostname: string;
  platform: string;
  staticInfo: StaticSystemInfo;
  dynamicStatus: DynamicSystemStatus;
}
