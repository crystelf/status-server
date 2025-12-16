import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ClientEntity } from './client.entity';

@Entity('disk_infos')
@Index(['clientId', 'device'])
export class DiskInfoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { length: 36 })
  @Index()
  clientId: string;

  @Column('varchar', { length: 255 })
  device: string;

  @Column('bigint')
  size: number;

  @Column('varchar', { length: 50 })
  type: string;

  @Column('varchar', { length: 50, nullable: true })
  interfaceType: string;

  @ManyToOne(() => ClientEntity, client => client.diskInfos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId' })
  client: ClientEntity;
}