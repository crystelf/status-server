import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientEntity } from '../entities';
import { DatabaseRetry } from '../utils';

@Injectable()
export class ClientRepository {
  constructor(
    @InjectRepository(ClientEntity)
    private readonly repository: Repository<ClientEntity>,
  ) {}

  /**
   * Upsert a client (insert or update if exists)
   * Database error handling with retry
   */
  @DatabaseRetry()
  async upsertClient(client: Partial<ClientEntity>): Promise<void> {
    await this.repository.save(client);
  }

  /**
   * Find all clients
   */
  @DatabaseRetry()
  async findAllClients(): Promise<ClientEntity[]> {
    return this.repository.find({
      order: {
        updatedAt: 'DESC',
      },
    });
  }

  /**
   * Find a client by ID
   */
  @DatabaseRetry()
  async findClientById(id: string): Promise<ClientEntity | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  /**
   * Delete a client by ID
   */
  @DatabaseRetry()
  async deleteClient(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  /**
   * Update client's last update timestamp
   */
  @DatabaseRetry()
  async updateLastUpdate(id: string): Promise<void> {
    await this.repository.update(id, {
      updatedAt: new Date(),
    });
  }
}
