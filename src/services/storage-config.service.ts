import { Injectable } from '@nestjs/common';
import { JsonStorageService } from './json-storage.service';

export enum StorageType {
  JSON = 'json'
}

@Injectable()
export class StorageConfigService {
  private currentStorageType: StorageType = StorageType.JSON;
  private isInitialized = true; // Always initialized since we only use JSON

  constructor(
    private readonly jsonStorageService: JsonStorageService,
  ) {
    console.log('Using JSON storage');
  }

  /**
   * Initialize storage configuration
   */
  async initializeStorage(): Promise<StorageType> {
    return this.currentStorageType;
  }

  /**
   * Get current storage type
   */
  getCurrentStorageType(): StorageType {
    return this.currentStorageType;
  }

  /**
   * Check if using SQLite (always false now)
   */
  isUsingSqlite(): boolean {
    return false;
  }

  /**
   * Check if using JSON (always true now)
   */
  isUsingJson(): boolean {
    return true;
  }

  /**
   * Get JSON storage service
   */
  getJsonStorageService(): JsonStorageService {
    return this.jsonStorageService;
  }

  /**
   * Force switch storage type (for testing)
   */
  forceStorageType(storageType: StorageType): void {
    this.currentStorageType = storageType;
    console.log(`Force switched to ${storageType} storage`);
  }
}