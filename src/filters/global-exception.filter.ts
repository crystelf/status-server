import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global exception filter to catch all unhandled exceptions
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: any = undefined;

    // Handle HTTP exceptions (like BadRequestException)
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || message;
        errors = (exceptionResponse as any).errors;
      } else {
        message = exceptionResponse as string;
      }
    } else if (exception instanceof Error) {
      // Handle standard errors
      message = exception.message;

      // Log detailed error stack for debugging
      this.logger.error(`Unhandled exception: ${exception.message}`, exception.stack);
    } else {
      // Handle unknown exceptions
      this.logger.error('Unknown exception occurred', JSON.stringify(exception));
    }

    // Build error response
    const errorResponse: any = {
      success: false,
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Include validation errors if present
    if (errors) {
      errorResponse.errors = errors;
    }

    this.logger.error(`${request.method} ${request.url} - Status: ${status} - Message: ${message}`);

    // Send unified error response
    response.status(status).json(errorResponse);
  }
}
