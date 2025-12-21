export interface ClientSummaryDto {
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
  priority: number;
}
