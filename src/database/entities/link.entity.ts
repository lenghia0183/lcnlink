import { Column, Entity, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Click } from './click.entity';
import { BaseModel } from '@core/schema/base.model';

@Entity('links')
export class Link extends BaseModel {
  @Column()
  userId: string;

  @ManyToOne(() => User, (user: User) => user.links, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'text' })
  originalUrl: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  shortedUrl: string;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: true })
  alias: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password: string;

  @Column({ type: 'timestamp', nullable: true })
  expireAt: Date;

  @Column({ type: 'int', nullable: true })
  maxClicks: number;

  @Column({ type: 'int', default: 0 })
  clicksCount: number;

  @Column({ type: 'int', default: 0 })
  successfulAccessCount: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => Click, (click) => click.link)
  clicks: Click[];
}
