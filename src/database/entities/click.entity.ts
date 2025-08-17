import {
  BaseEntity,
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Link } from './link.entity';

@Entity('clicks')
export class Click extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  linkId: string;

  @ManyToOne(() => Link, (link) => link.clicks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'linkId' })
  link: Link;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ipAddress: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  country: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  device: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  browser: string;

  @Column({ type: 'text', nullable: true })
  referrer: string;

  @CreateDateColumn()
  clickedAt: Date;
}
