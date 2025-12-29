import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';

@Injectable()
export class JsonStorageService {
  private readonly dataDir = 'data';
  private readonly jsonDir = path.join(this.dataDir, 'json-storage');
  private readonly cache: Map<string, any[]> = new Map();
  private readonly cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 5000; // 5 seconds cache TTL
  
  // Write batching configuration
  private readonly writeQueue: Map<string, any[]> = new Map();
  private readonly writeTimer: NodeJS.Timeout;
  private readonly BATCH_WRITE_INTERVAL = 1000; // 1 second write interval

  constructor() {
    this.ensureDirectoryExistsSync();
    // Start the write batching timer
    this.writeTimer = setInterval(() => this.flushWriteQueue(), this.BATCH_WRITE_INTERVAL);
  }

  /**
   * Ensure JSON storage directory exists (synchronous initialization)
   */
  private ensureDirectoryExistsSync(): void {
    if (!fsSync.existsSync(this.dataDir)) {
      fsSync.mkdirSync(this.dataDir, { recursive: true });
    }
    if (!fsSync.existsSync(this.jsonDir)) {
      fsSync.mkdirSync(this.jsonDir, { recursive: true });
    }
  }

  /**
   * Ensure JSON storage directory exists (asynchronous)
   */
  private async ensureDirectoryExists(): Promise<void> {
    try {
      await fs.access(this.dataDir);
    } catch {
      await fs.mkdir(this.dataDir, { recursive: true });
    }
    try {
      await fs.access(this.jsonDir);
    } catch {
      await fs.mkdir(this.jsonDir, { recursive: true });
    }
  }

  /**
   * Get JSON file path
   */
  private getFilePath(collection: string): string {
    return path.join(this.jsonDir, `${collection}.json`);
  }

  /**
   * Check if cache is valid for a collection
   */
  private isCacheValid(collection: string): boolean {
    const expiry = this.cacheExpiry.get(collection);
    return this.cache.has(collection) && expiry !== undefined && Date.now() < expiry;
  }

  /**
   * Read JSON file content asynchronously
   */
  private async readJsonFile(collection: string): Promise<any[]> {
    // Check cache first
    if (this.isCacheValid(collection)) {
      return this.cache.get(collection)!;
    }

    const filePath = this.getFilePath(collection);
    try {
      await fs.access(filePath);
      const content = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(content);
      
      // Update cache
      this.cache.set(collection, data);
      this.cacheExpiry.set(collection, Date.now() + this.CACHE_TTL);
      
      return data;
    } catch (error) {
      console.error(`Failed to read JSON file ${collection}:`, error);
      return [];
    }
  }

  /**
   * Queue data for writing (batching)
   */
  private queueWrite(collection: string, data: any[]): void {
    this.writeQueue.set(collection, data);
  }

  /**
   * Flush the write queue to disk
   */
  private async flushWriteQueue(): Promise<void> {
    if (this.writeQueue.size === 0) {
      return;
    }

    const collectionsToWrite = Array.from(this.writeQueue.entries());
    this.writeQueue.clear();

    try {
      await Promise.all(collectionsToWrite.map(async ([collection, data]) => {
        await this.writeJsonFileDirect(collection, data);
      }));
    } catch (error) {
      console.error('Failed to flush write queue:', error);
      // Requeue failed writes
      collectionsToWrite.forEach(([collection, data]) => {
        this.writeQueue.set(collection, data);
      });
    }
  }

  /**
   * Write JSON file content directly to disk
   */
  private async writeJsonFileDirect(collection: string, data: any[]): Promise<void> {
    await this.ensureDirectoryExists();
    const filePath = this.getFilePath(collection);
    try {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
      console.error(`Failed to write JSON file ${collection}:`, error);
      throw error;
    }
  }

  /**
   * Write JSON file content (using batching)
   */
  private async writeJsonFile(collection: string, data: any[]): Promise<void> {
    // Update cache immediately for consistency
    this.cache.set(collection, data);
    this.cacheExpiry.set(collection, Date.now() + this.CACHE_TTL);
    
    // Queue for batch writing
    this.queueWrite(collection, data);
  }

  /**
   * Find all records
   */
  async findAll(collection: string): Promise<any[]> {
    return this.readJsonFile(collection);
  }

  /**
   * Find records by conditions
   */
  async findMany(collection: string, conditions: any): Promise<any[]> {
    const data = await this.readJsonFile(collection);
    return this.filterData(data, conditions);
  }

  /**
   * Find a record by ID
   */
  async findOne(collection: string, id: string): Promise<any> {
    const data = await this.readJsonFile(collection);
    return data.find(item => item.id === id);
  }

  /**
   * Create a record
   */
  async create(collection: string, item: any): Promise<any> {
    const data = await this.readJsonFile(collection);
    const newItem = {
      ...item,
      id: item.id || this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    data.push(newItem);
    await this.writeJsonFile(collection, data);
    return newItem;
  }

  /**
   * Update a record
   */
  async update(collection: string, id: string, updates: any): Promise<any> {
    const data = await this.readJsonFile(collection);
    const index = data.findIndex(item => item.id === id);
    if (index === -1) {
      return null;
    }
    
    data[index] = {
      ...data[index],
      ...updates,
      updatedAt: new Date()
    };
    
    await this.writeJsonFile(collection, data);
    return data[index];
  }

  /**
   * Delete a record
   */
  async delete(collection: string, id: string): Promise<boolean> {
    const data = await this.readJsonFile(collection);
    const index = data.findIndex(item => item.id === id);
    if (index === -1) {
      return false;
    }
    
    data.splice(index, 1);
    await this.writeJsonFile(collection, data);
    return true;
  }

  /**
   * Delete records by conditions
   */
  async deleteMany(collection: string, conditions: any): Promise<boolean> {
    const data = await this.readJsonFile(collection);
    const filteredData = this.filterData(data, conditions, true);
    await this.writeJsonFile(collection, filteredData);
    return true;
  }

  /**
   * Count records
   */
  async count(collection: string, conditions?: any): Promise<number> {
    const data = await this.readJsonFile(collection);
    if (!conditions) {
      return data.length;
    }
    return this.filterData(data, conditions).length;
  }

  /**
   * Filter data by conditions
   */
  private filterData(data: any[], conditions: any, exclude = false): any[] {
    if (!conditions || Object.keys(conditions).length === 0) {
      return data;
    }

    return data.filter(item => {
      let match = true;
      
      for (const [key, value] of Object.entries(conditions)) {
        if (key === 'where') {
          // Handle TypeORM-style where conditions
          match = this.handleWhereCondition(item, value);
        } else if (key === 'order') {
          // Sorting handled after filtering
          continue;
        } else if (key === 'limit') {
          // Limit handled after filtering
          continue;
        } else if (key === 'offset') {
          // Offset handled after filtering
          continue;
        } else {
          // Simple property matching
          if (item[key] !== value) {
            match = false;
            break;
          }
        }
      }
      
      return exclude ? !match : match;
    });
  }

  /**
   * Handle TypeORM-style where conditions
   */
  private handleWhereCondition(item: any, where: any): boolean {
    for (const [key, value] of Object.entries(where)) {
      if (typeof value === 'object' && value !== null) {
        // Handle Between condition
        if (this.isBetweenCondition(value)) {
          const [start, end] = (value as any).Between;
          if (item[key] < start || item[key] > end) {
            return false;
          }
        }
        // Handle LessThan condition
        else if (this.isLessThanCondition(value)) {
          const limit = (value as any).LessThan;
          if (item[key] >= limit) {
            return false;
          }
        }
      } else {
        // Simple equality comparison
        if (item[key] !== value) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Check if it's a Between condition
   */
  private isBetweenCondition(obj: any): boolean {
    return obj && typeof obj === 'object' && 'Between' in obj;
  }

  /**
   * Check if it's a LessThan condition
   */
  private isLessThanCondition(obj: any): boolean {
    return obj && typeof obj === 'object' && 'LessThan' in obj;
  }

  /**
   * Generate simple ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Apply sorting
   */
  applySorting(data: any[], order: any): any[] {
    if (!order) {
      return data;
    }

    return data.sort((a, b) => {
      for (const [key, direction] of Object.entries(order)) {
        const aVal = a[key];
        const bVal = b[key];
        
        if (aVal < bVal) {
          return direction === 'ASC' ? -1 : 1;
        }
        if (aVal > bVal) {
          return direction === 'ASC' ? 1 : -1;
        }
      }
      return 0;
    });
  }

  /**
   * Apply pagination
   */
  applyPagination(data: any[], limit?: number, offset?: number): any[] {
    let result = data;
    
    if (offset !== undefined && offset > 0) {
      result = result.slice(offset);
    }
    
    if (limit !== undefined && limit > 0) {
      result = result.slice(0, limit);
    }
    
    return result;
  }

  /**
   * Execute complex query (with sorting and pagination)
   */
  async query(collection: string, options: any): Promise<any[]> {
    let data = await this.findMany(collection, options);
    
    // Apply sorting
    if (options.order) {
      data = this.applySorting(data, options.order);
    }
    
    // Apply pagination
    data = this.applyPagination(data, options.limit, options.offset);
    
    return data;
  }
}