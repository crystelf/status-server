import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientEntity } from './entities';
import { StatusEntity } from './entities';
import { ConfigEntity } from './entities';
import { ClientRepository } from './repositories';
import { StatusRepository } from './repositories';
import { ConfigRepository } from './repositories';
import { ClientService } from './services';
import { ValidationService } from './services';
import { CleanupService } from './services';
import { ConfigService } from './config';
import { ReportController } from './controllers';
import { ClientController } from './controllers';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'data/system-monitor.db',
      entities: [ClientEntity, StatusEntity, ConfigEntity],
      synchronize: true, // Auto-create tables in development
      logging: false,
    }),
    TypeOrmModule.forFeature([ClientEntity, StatusEntity, ConfigEntity]),
  ],
  controllers: [ReportController, ClientController],
  providers: [
    ClientRepository,
    StatusRepository,
    ConfigRepository,
    ClientService,
    ValidationService,
    CleanupService,
    ConfigService,
  ],
  exports: [
    ClientRepository,
    StatusRepository,
    ConfigRepository,
    ClientService,
    ValidationService,
    CleanupService,
    ConfigService,
  ],
})
export class AppModule {}
