import { Controller, Get, Param, Query, NotFoundException, Logger } from '@nestjs/common';
import { ClientService } from '../services';
import { ValidationService } from '../services';
import { ClientSummaryDto } from '../dto';
import { ClientDetailDto } from '../dto';
import { DynamicSystemStatus } from '../dto';

/**
 * ClientController handles client data queries
 */
@Controller('clients')
export class ClientController {
  private readonly logger = new Logger(ClientController.name);

  constructor(
    private readonly clientService: ClientService,
    private readonly validationService: ValidationService,
  ) {}

  /**
   * GET /api/clients - Get all clients
   */
  @Get()
  async getAllClients(): Promise<ClientSummaryDto[]> {
    try {
      const clients = await this.clientService.getAllClients();
      this.logger.log(`Retrieved ${clients.length} clients`);
      return clients;
    } catch (error) {
      this.logger.error('Failed to get all clients', error);
      throw error;
    }
  }

  /**
   * GET /api/clients/:id - Get client detail
   */
  @Get(':id')
  async getClientDetail(@Param('id') id: string): Promise<ClientDetailDto> {
    try {
      // Validate parameter (Requirement 4.4)
      if (!id || id.trim() === '') {
        throw new NotFoundException({
          message: 'Invalid client ID',
          errors: ['Client ID must be a non-empty string'],
        });
      }

      const client = await this.clientService.getClientById(id);

      // Handle not found case (Requirement 4.4)
      if (!client) {
        throw new NotFoundException({
          message: 'Client not found',
          errors: [`Client with ID ${id} does not exist`],
        });
      }

      this.logger.log(`Retrieved client detail for ${id}`);
      return client;
    } catch (error) {
      this.logger.error(`Failed to get client ${id}`, error);
      throw error;
    }
  }

  /**
   * GET /api/clients/:id/history - Get client history
   */
  @Get(':id/history')
  async getClientHistory(
    @Param('id') id: string,
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
  ): Promise<DynamicSystemStatus[]> {
    try {
      // Validate parameters (Requirement 4.4)
      this.validationService.validateHistoryQuery(id, startTime, endTime);

      const start = Number(startTime);
      const end = Number(endTime);

      const history = await this.clientService.getClientHistory(id, start, end);

      this.logger.log(`Retrieved ${history.length} history records for client ${id}`);
      return history;
    } catch (error) {
      this.logger.error(`Failed to get history for client ${id}`, error);
      throw error;
    }
  }
}
