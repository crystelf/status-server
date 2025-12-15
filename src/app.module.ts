import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientEntity } from './entities';
import { StatusEntity } from './entities';
import { ConfigEntity } from './entities';
import { DiskInfoEntity } from './entities';
import { DiskUsageEntity } from './entities';
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
import { DatabaseDetectionService } from './utils';
import { JsonStorageService } from './services';
import { StorageConfigService } from './services';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: async (storageConfigService: StorageConfigService) => {
        const storageType = await storageConfigService.initializeStorage();
        
        if (storageType === 'sqlite') {
          return {
            type: 'sqlite',
            database: 'data/system-monitor.db',
            entities: [ClientEntity, StatusEntity, ConfigEntity, DiskInfoEntity, DiskUsageEntity],
            synchronize: true, // Auto-create tables in development
            logging: false,
          };
        }
        
        // 返回一个空配置，当使用JSON存储时不会实际使用TypeORM
        return {
          type: 'sqlite',
          database: ':memory:',
          entities: [],
          synchronize: false,
          logging: false,
        };
      },
      inject: [StorageConfigService],
    }),
    TypeOrmModule.forFeature([ClientEntity, StatusEntity, ConfigEntity, DiskInfoEntity, DiskUsageEntity]),
  ],
  controllers: [ReportController, ClientController],
  providers: [
    DatabaseDetectionService,
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
    DatabaseDetectionService,
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
