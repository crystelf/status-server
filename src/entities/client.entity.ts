import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { StatusEntity } from './status.entity';

@Entity('clients')
export class ClientEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column('varchar', { length: 255 })
  name: string;

  @Column('text')
  tags: string; // JSON array stored as string

  @Column('varchar', { length: 500, nullable: true })
  purpose: string;

  @Column('varchar', { length: 255 })
  hostname: string;

  @Column('varchar', { length: 20 })
  platform: string;

  @Column('varchar', { length: 255, nullable: true })
  cpuModel: string;

  @Column('integer', { nullable: true })
  cpuCores: number;

  @Column('varchar', { length: 50, nullable: true })
  cpuArch: string;

  @Column('varchar', { length: 255, nullable: true })
  systemVersion: string;

  @Column('varchar', { length: 255, nullable: true })
  systemModel: string;

  @Column('bigint', { nullable: true })
  totalMemory: number;

  @Column('bigint', { nullable: true })
  totalSwap: number;

  @Column('bigint', { nullable: true })
  totalDisk: number;

  @Column('varchar', { length: 50, nullable: true })
  diskType: string;

  @Column('varchar', { length: 255, nullable: true })
  location: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => StatusEntity, (status: StatusEntity) => status.client)
  statuses: StatusEntity[];
}
