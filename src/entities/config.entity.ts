import { Entity, Column, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('config')
export class ConfigEntity {
  @PrimaryColumn('varchar', { length: 100 })
  key: string;

  @Column('text')
  value: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
