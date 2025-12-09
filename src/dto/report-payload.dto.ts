export interface StaticSystemInfo {
  cpuModel: string;
  cpuCores: number;
  cpuArch: string;
  systemVersion: string;
  systemModel: string;
  totalMemory: number;
  totalSwap: number;
  totalDisk: number;
  diskType: string;
  location: string;
}

export interface DynamicSystemStatus {
  cpuUsage: number;
  cpuFrequency: number;
  memoryUsage: number;
  swapUsage: number;
  diskUsage: number;
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
