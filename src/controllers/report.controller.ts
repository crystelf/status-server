import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ClientService } from '../services';
import { ValidationService } from '../services';
import { ReportPayloadDto } from '../dto';

/**
 * ReportController handles client report submissions
 */
@Controller('reports')
export class ReportController {
  private readonly logger = new Logger(ReportController.name);

  constructor(
    private readonly clientService: ClientService,
    private readonly validationService: ValidationService,
  ) {}

  /**
   * POST /api/reports - Receive client report
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  async receiveReport(@Body() payload: any): Promise<{ success: boolean; message?: string }> {
    try {
      const validatedPayload: ReportPayloadDto =
        this.validationService.validateReportPayload(payload);
      await this.clientService.saveReport(validatedPayload);
      this.logger.log(`Report received from client ${validatedPayload.clientId}`);
      return { success: true };
    } catch (error) {
      this.logger.error('Failed to process report', error);

      // Re-throw the error to let NestJS handle it
      // BadRequestException will return 400, other errors will return 500
      throw error;
    }
  }
}
