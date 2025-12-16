import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ClientEntity } from './client.entity';

@Entity('disk_usages')
@Index(['clientId', 'timestamp', 'device'])
export class DiskUsageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 36 })
  @Index()
  clientId: string;

  @Column('varchar', { length: 255 })
  device: string;

  @Column('bigint')
  size: number;

  @Column('bigint')
  used: number;

  @Column('bigint')
  available: number;

  @Column('decimal', { precision: 5, scale: 2 })
  usagePercent: number;

  @Column('varchar', { length: 255, nullable: true })
  mountpoint: string;

  @Column('datetime')
  @Index()
  timestamp: Date;

  @ManyToOne(() => ClientEntity, client => client.diskUsages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId' })
  client: ClientEntity;
}