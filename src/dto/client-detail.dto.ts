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
  createdAt: number;
  lastOnlineAt: number | null;
  staticInfo: StaticSystemInfo;
  currentStatus: DynamicSystemStatus;
}
