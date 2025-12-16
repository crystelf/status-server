import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class JsonStorageService {
  private readonly dataDir = 'data';
  private readonly jsonDir = path.join(this.dataDir, 'json-storage');

  constructor() {
    this.ensureDirectoryExists();
  }

  /**
   * Ensure JSON storage directory exists
   */
  private ensureDirectoryExists(): void {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    if (!fs.existsSync(this.jsonDir)) {
      fs.mkdirSync(this.jsonDir, { recursive: true });
    }
  }

  /**
   * Get JSON file path
   */
  private getFilePath(collection: string): string {
    return path.join(this.jsonDir, `${collection}.json`);
  }

  /**
   * Read JSON file content
   */
  private readJsonFile(collection: string): any[] {
    const filePath = this.getFilePath(collection);
    try {
      if (!fs.existsSync(filePath)) {
        return [];
      }
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.error(`Failed to read JSON file ${collection}:`, error);
      return [];
    }
  }

  /**
   * Write JSON file content
   */
  private writeJsonFile(collection: string, data: any[]): void {
    const filePath = this.getFilePath(collection);
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
      console.error(`Failed to write JSON file ${collection}:`, error);
      throw error;
    }
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
    const data = this.readJsonFile(collection);
    return this.filterData(data, conditions);
  }

  /**
   * Find a record by ID
   */
  async findOne(collection: string, id: string): Promise<any> {
    const data = this.readJsonFile(collection);
    return data.find(item => item.id === id);
  }

  /**
   * Create a record
   */
  async create(collection: string, item: any): Promise<any> {
    const data = this.readJsonFile(collection);
    const newItem = {
      ...item,
      id: item.id || this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    data.push(newItem);
    this.writeJsonFile(collection, data);
    return newItem;
  }

  /**
   * Update a record
   */
  async update(collection: string, id: string, updates: any): Promise<any> {
    const data = this.readJsonFile(collection);
    const index = data.findIndex(item => item.id === id);
    if (index === -1) {
      return null;
    }
    
    data[index] = {
      ...data[index],
      ...updates,
      updatedAt: new Date()
    };
    
    this.writeJsonFile(collection, data);
    return data[index];
  }

  /**
   * Delete a record
   */
  async delete(collection: string, id: string): Promise<boolean> {
    const data = this.readJsonFile(collection);
    const index = data.findIndex(item => item.id === id);
    if (index === -1) {
      return false;
    }
    
    data.splice(index, 1);
    this.writeJsonFile(collection, data);
    return true;
  }

  /**
   * Delete records by conditions
   */
  async deleteMany(collection: string, conditions: any): Promise<boolean> {
    const data = this.readJsonFile(collection);
    const filteredData = this.filterData(data, conditions, true);
    this.writeJsonFile(collection, filteredData);
    return true;
  }

  /**
   * Count records
   */
  async count(collection: string, conditions?: any): Promise<number> {
    const data = this.readJsonFile(collection);
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