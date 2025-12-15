import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientEntity } from '../entities';
import { DatabaseRetry } from '../utils';
import { StorageConfigService, JsonStorageService } from '../services';

@Injectable()
export class ClientRepository {
  constructor(
    @InjectRepository(ClientEntity)
    private readonly repository: Repository<ClientEntity>,
    private readonly storageConfigService: StorageConfigService,
    private readonly jsonStorageService: JsonStorageService,
  ) {}

  /**
   * Upsert a client (insert or update if exists)
   * Database error handling with retry
   */
  @DatabaseRetry()
  async upsertClient(client: Partial<ClientEntity>): Promise<void> {
    if (this.storageConfigService.isUsingSqlite()) {
      await this.repository.save(client);
    } else {
      // 使用JSON存储
      const existingClient = await this.jsonStorageService.findOne('clients', client.id);
      if (existingClient) {
        await this.jsonStorageService.update('clients', client.id, client);
      } else {
        await this.jsonStorageService.create('clients', client);
      }
    }
  }

  /**
   * Find all clients
   */
  @DatabaseRetry()
  async findAllClients(): Promise<ClientEntity[]> {
    if (this.storageConfigService.isUsingSqlite()) {
      return this.repository.find({
        order: {
          updatedAt: 'DESC',
        },
      });
    } else {
      // 使用JSON存储
      const clients = await this.jsonStorageService.findAll('clients');
      // 按更新时间降序排序
      return clients.sort((a, b) => {
        const aTime = new Date(a.updatedAt).getTime();
        const bTime = new Date(b.updatedAt).getTime();
        return bTime - aTime;
      });
    }
  }

  /**
   * Find a client by ID
   */
  @DatabaseRetry()
  async findClientById(id: string): Promise<ClientEntity | null> {
    if (this.storageConfigService.isUsingSqlite()) {
      return this.repository.findOne({
        where: { id },
      });
    } else {
      // 使用JSON存储
      return await this.jsonStorageService.findOne('clients', id);
    }
  }

  /**
   * Delete a client by ID
   */
  @DatabaseRetry()
  async deleteClient(id: string): Promise<void> {
    if (this.storageConfigService.isUsingSqlite()) {
      await this.repository.delete(id);
    } else {
      // 使用JSON存储
      await this.jsonStorageService.delete('clients', id);
    }
  }

  /**
   * Update client's last update timestamp
   */
  @DatabaseRetry()
  async updateLastUpdate(id: string): Promise<void> {
    if (this.storageConfigService.isUsingSqlite()) {
      await this.repository.update(id, {
        updatedAt: new Date(),
      });
    } else {
      // 使用JSON存储
      await this.jsonStorageService.update('clients', id, {
        updatedAt: new Date(),
      });
    }
  }
}
