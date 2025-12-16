import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DatabaseDetectionService {
  private isSqliteAvailable: boolean | null = null;
  private readonly dbDirectory = 'data';
  private readonly dbPath = path.join(this.dbDirectory, 'system-monitor.db');

  /**
   * Check if SQLite is available
   * Determines SQLite availability by attempting to create database directory and test connection
   */
  async isSQLiteAvailable(): Promise<boolean> {
    // Return cached result if already detected
    if (this.isSqliteAvailable !== null) {
      return this.isSqliteAvailable;
    }

    try {
      // Check if sqlite3 module is available
      // eslint-disable-next-line @typescript-eslint/no-var-requires,@typescript-eslint/no-unused-vars
      const sqlite3 = require('sqlite3');
      
      // Ensure data directory exists
      await this.ensureDataDirectory();
      
      // Try to create a test database connection
      const testResult = await this.testSqliteConnection();
      
      this.isSqliteAvailable = testResult;
      return this.isSqliteAvailable;
    } catch (error) {
      console.warn('SQLite detection failed:', error.message);
      this.isSqliteAvailable = false;
      return false;
    }
  }

  /**
   * Ensure data directory exists
   */
  private async ensureDataDirectory(): Promise<void> {
    return new Promise((resolve, reject) => {
      fs.mkdir(this.dbDirectory, { recursive: true }, (err: any) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Test SQLite connection
   */
  private async testSqliteConnection(): Promise<boolean> {
    return new Promise((resolve) => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const sqlite3 = require('sqlite3');
      const testDbPath = path.join(this.dbDirectory, 'test-connection.db');
      
      // Create a test database
      const db = new sqlite3.Database(testDbPath, (err: any) => {
        if (err) {
          resolve(false);
          return;
        }
        
        // Try to execute a simple query
        db.run('CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY)', (err: any) => {
          if (err) {
            db.close();
            resolve(false);
            return;
          }
          
          // Close connection and delete test file
          db.close((err: any) => {
            if (err) {
              resolve(false);
              return;
            }
            
            // Delete test file
            fs.unlink(testDbPath, () => {
              resolve(true);
            });
          });
        });
      });
    });
  }

  /**
   * Get database path
   */
  getDatabasePath(): string {
    return this.dbPath;
  }

  /**
   * Reset detection status (for re-detection)
   */
  resetDetection(): void {
    this.isSqliteAvailable = null;
  }
}