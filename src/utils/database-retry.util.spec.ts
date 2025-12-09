import { withDatabaseRetry } from './database-retry.util';

describe('Database Retry Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should succeed on first attempt', async () => {
    const operation = jest.fn().mockResolvedValue('success');

    const result = await withDatabaseRetry(operation, 'test-operation');

    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should retry on database error and eventually succeed', async () => {
    const operation = jest
      .fn()
      .mockRejectedValueOnce(new Error('database connection failed'))
      .mockResolvedValueOnce('success');

    const result = await withDatabaseRetry(
      operation,
      'test-operation',
      { maxRetries: 3, delayMs: 10 },
    );

    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('should throw after max retries exhausted', async () => {
    const operation = jest
      .fn()
      .mockRejectedValue(new Error('database connection failed'));

    await expect(
      withDatabaseRetry(operation, 'test-operation', {
        maxRetries: 2,
        delayMs: 10,
      }),
    ).rejects.toThrow('database connection failed');

    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('should not retry on non-database errors', async () => {
    const operation = jest
      .fn()
      .mockRejectedValue(new Error('validation error'));

    await expect(
      withDatabaseRetry(operation, 'test-operation', {
        maxRetries: 3,
        delayMs: 10,
      }),
    ).rejects.toThrow('validation error');

    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should implement exponential backoff', async () => {
    const operation = jest
      .fn()
      .mockRejectedValueOnce(new Error('sqlite busy'))
      .mockRejectedValueOnce(new Error('sqlite busy'))
      .mockResolvedValueOnce('success');

    const startTime = Date.now();
    await withDatabaseRetry(operation, 'test-operation', {
      maxRetries: 3,
      delayMs: 50,
      backoffMultiplier: 2,
    });
    const endTime = Date.now();

    // First retry: 50ms, second retry: 100ms = 150ms total minimum
    expect(endTime - startTime).toBeGreaterThanOrEqual(150);
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('should recognize various database error patterns', async () => {
    const databaseErrors = [
      new Error('SQLITE_BUSY'),
      new Error('database locked'),
      new Error('connection timeout'),
      new Error('ECONNREFUSED'),
      new Error('query failed'),
    ];

    for (const error of databaseErrors) {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('success');

      const result = await withDatabaseRetry(operation, 'test-operation', {
        maxRetries: 2,
        delayMs: 10,
      });

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
      jest.clearAllMocks();
    }
  });
});
