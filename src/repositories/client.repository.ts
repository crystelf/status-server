import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { ClientEntity } from '../entities';
import { DatabaseRetry } from '../utils';
import { JsonStorageService } from '../services';

@Injectable()
export class ClientRepository {
  constructor(
    @Inject(forwardRef(() => JsonStorageService))
    private readonly jsonStorageService: JsonStorageService,
  ) {}

  /**
   * Upsert a client (insert or update if exists)
   * File system error handling with retry
   */
  @DatabaseRetry()
  async upsertClient(client: Partial<ClientEntity>): Promise<void> {
    if (!client.id) {
      throw new Error('Client ID is required for JSON storage');
    }
    const existingClient = await this.jsonStorageService.findOne('clients', client.id);
    if (existingClient) {
      await this.jsonStorageService.update('clients', client.id, client);
    } else {
      await this.jsonStorageService.create('clients', client);
    }
  }

  /**
   * Find all clients
   */
  @DatabaseRetry()
  async findAllClients(): Promise<ClientEntity[]> {
    const clients = await this.jsonStorageService.findAll('clients');
    // Sort by update time in descending order
    return clients.sort((a, b) => {
      const aTime = new Date(a.updatedAt).getTime();
      const bTime = new Date(b.updatedAt).getTime();
      return bTime - aTime;
    });
  }

  /**
   * Find a client by ID
   */
  @DatabaseRetry()
  async findClientById(id: string): Promise<ClientEntity | null> {
    return await this.jsonStorageService.findOne('clients', id);
  }

  /**
   * Delete a client by ID
   */
  @DatabaseRetry()
  async deleteClient(id: string): Promise<void> {
    await this.jsonStorageService.delete('clients', id);
  }

  /**
   * Update client's last update timestamp
   */
  @DatabaseRetry()
  async updateLastUpdate(id: string): Promise<void> {
    await this.jsonStorageService.update('clients', id, {
      updatedAt: new Date(),
    });
  }
}