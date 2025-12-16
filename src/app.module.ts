import { Module } from '@nestjs/common';
import { ClientRepository } from './repositories';
import { StatusRepository } from './repositories';
import { ConfigRepository } from './repositories';
import { DiskInfoRepository } from './repositories';
import { DiskUsageRepository } from './repositories';
import { ClientService } from './services';
import { ValidationService } from './services';
import { CleanupService } from './services';
import { ConfigService } from './config';
import { ReportController } from './controllers';
import { ClientController } from './controllers';
import { JsonStorageService } from './services';
import { StorageConfigService } from './services';

@Module({
  imports: [
    // TypeORM disabled - using JSON storage only
  ],
  controllers: [ReportController, ClientController],
  providers: [
    JsonStorageService,
    StorageConfigService,
    ClientRepository,
    StatusRepository,
    ConfigRepository,
    DiskInfoRepository,
    DiskUsageRepository,
    ClientService,
    ValidationService,
    CleanupService,
    ConfigService,
  ],
  exports: [
    JsonStorageService,
    StorageConfigService,
    ClientRepository,
    StatusRepository,
    ConfigRepository,
    DiskInfoRepository,
    DiskUsageRepository,
    ClientService,
    ValidationService,
    CleanupService,
    ConfigService,
  ],
})
export class AppModule {}
