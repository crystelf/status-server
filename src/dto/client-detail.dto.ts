import { StaticSystemInfo, DynamicSystemStatus } from './report-payload.dto';

export interface ClientDetailDto {
  clientId: string;
  clientName: string;
  clientTags: string[];
  clientPurpose: string;
  hostname: string;
  platform: string;
  status: 'online' | 'offline';
  lastUpdate: number;
  staticInfo: StaticSystemInfo;
  currentStatus: DynamicSystemStatus;
}
