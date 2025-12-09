import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ClientEntity } from './client.entity';

@Entity('statuses')
@Index(['clientId', 'timestamp'])
export class StatusEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 36 })
  @Index()
  clientId: string;

  @Column('decimal', { precision: 5, scale: 2 })
  cpuUsage: number;

  @Column('decimal', { precision: 5, scale: 2 })
  cpuFrequency: number;

  @Column('decimal', { precision: 5, scale: 2 })
  memoryUsage: number;

  @Column('decimal', { precision: 5, scale: 2 })
  swapUsage: number;

  @Column('decimal', { precision: 5, scale: 2 })
  diskUsage: number;

  @Column('bigint')
  networkUpload: number;

  @Column('bigint')
  networkDownload: number;

  @Column('datetime')
  @Index()
  timestamp: Date;

  @ManyToOne(() => ClientEntity, client => client.statuses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId' })
  client: ClientEntity;
}
