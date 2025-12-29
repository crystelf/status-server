import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ClientEntity } from '../entities';

@Injectable()
export class ClientRepository {
  constructor(
    @InjectRepository(ClientEntity)
    private readonly clientRepository: Repository<ClientEntity>,
  ) {}

  /**
   * Upsert a client (insert or update if exists)
   */
  async upsertClient(client: Partial<ClientEntity>): Promise<void> {
    if (!client.id) {
      throw new Error('Client ID is required for database storage');
    }
    await this.clientRepository.save(client);
  }

  /**
   * Find all clients
   */
  async findAllClients(): Promise<ClientEntity[]> {
    return this.clientRepository.find({
      order: {
        updatedAt: 'DESC',
      },
    });
  }

  /**
   * Find a client by ID
   */
  async findClientById(id: string): Promise<ClientEntity | null> {
    return this.clientRepository.findOneBy({ id });
  }

  /**
   * Delete a client by ID
   */
  async deleteClient(id: string): Promise<void> {
    await this.clientRepository.delete(id);
  }

  /**
   * Update client's last update timestamp
   */
  async updateLastUpdate(id: string): Promise<void> {
    await this.clientRepository.update(id, {
      updatedAt: new Date(),
    });
  }

  /**
   * Update client's last online timestamp
   */
  async updateLastOnlineAt(id: string, lastOnlineAt: Date | null): Promise<void> {
    await this.clientRepository.update(id, {
      lastOnlineAt: lastOnlineAt,
    });
  }
}