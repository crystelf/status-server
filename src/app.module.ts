import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
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
import { ClientEntity } from './entities';
import { StatusEntity } from './entities';
import { ConfigEntity } from './entities';
import { DiskInfoEntity } from './entities';
import { DiskUsageEntity } from './entities';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: './data/status.db',
      entities: [ClientEntity, StatusEntity, ConfigEntity, DiskInfoEntity, DiskUsageEntity],
      synchronize: true,
      logging: false,
      migrationsRun: false,
      migrationsTableName: 'migrations',
    }),
    TypeOrmModule.forFeature([ClientEntity, StatusEntity, ConfigEntity, DiskInfoEntity, DiskUsageEntity]),
  ],
  controllers: [ReportController, ClientController],
  providers: [
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
