/**
 * Server configuration interface
 */
export interface ServerConfig {
  /**
   * Port number for the server to listen on
   */
  port: number;

  /**
   * Number of days to retain historical data
   * Default: 30 days
   */
  dataRetentionDays: number;

  /**
   * Database file path
   */
  databasePath?: string;
}

/**
 * Default server configuration
 */
export const DEFAULT_SERVER_CONFIG: ServerConfig = {
  port: 7788,
  dataRetentionDays: 30,
  databasePath: 'data/system-monitor.db',
};
