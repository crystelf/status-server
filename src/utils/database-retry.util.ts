import { Logger } from '@nestjs/common';

/**
 * Database retry utility for handling connection errors
 * Requirements: 7.2
 */

export interface RetryOptions {
  maxRetries?: number;
  delayMs?: number;
  backoffMultiplier?: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
};

/**
 * Execute a database operation with retry logic
 * Implements exponential backoff for retries
 */
export async function withDatabaseRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  options: RetryOptions = {},
): Promise<T> {
  const logger = new Logger('DatabaseRetry');
  const opts = { ...DEFAULT_OPTIONS, ...options };

  let lastError: Error | undefined;
  let delay = opts.delayMs;

  for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Check if error is database-related
      if (isDatabaseError(error)) {
        logger.warn(
          `Database operation "${operationName}" failed (attempt ${attempt}/${opts.maxRetries}): ${lastError.message}`,
        );

        // If not the last attempt, wait and retry
        if (attempt < opts.maxRetries) {
          logger.log(`Retrying in ${delay}ms...`);
          await sleep(delay);
          delay *= opts.backoffMultiplier; // Exponential backoff
        }
      } else {
        // Non-database error, throw immediately
        throw error;
      }
    }
  }

  // All retries exhausted
  logger.error(
    `Database operation "${operationName}" failed after ${opts.maxRetries} attempts`,
    lastError?.stack,
  );
  throw lastError;
}

/**
 * Check if an error is database-related
 */
function isDatabaseError(error: any): boolean {
  if (!error) return false;

  const errorMessage = error.message?.toLowerCase() || '';
  const errorName = error.name?.toLowerCase() || '';

  // Common database error patterns
  const dbErrorPatterns = [
    'sqlite',
    'database',
    'connection',
    'econnrefused',
    'timeout',
    'lock',
    'busy',
    'constraint',
    'query',
  ];

  return dbErrorPatterns.some(
    (pattern) => errorMessage.includes(pattern) || errorName.includes(pattern),
  );
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Decorator for automatic retry on database operations
 */
export function DatabaseRetry(options: RetryOptions = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return withDatabaseRetry(
        () => originalMethod.apply(this, args),
        `${target.constructor.name}.${propertyKey}`,
        options,
      );
    };

    return descriptor;
  };
}
