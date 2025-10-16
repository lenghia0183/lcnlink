import {
  Column,
  Entity,
  ManyToOne,
  JoinColumn,
  OneToMany,
  BeforeUpdate,
  BeforeInsert,
} from 'typeorm';
import { User } from './user.entity';
import { Click } from './click.entity';
import { BaseModel } from '@core/schema/base.model';
import { LINK_STATUS } from '@components/link/link.constant';
import { Referrer } from './referrer.entity';

@Entity('links')
export class Link extends BaseModel {
  @Column({ type: 'varchar', nullable: true })
  userId: string | null;

  @ManyToOne(() => User, (user: User) => user.links, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'text' })
  originalUrl: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  shortedUrl: string;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: true })
  alias: string;

  @Column({ type: 'text', nullable: true, default: '' })
  description: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password: string;

  @Column({ type: 'timestamp', nullable: true })
  expireAt: Date;

  @Column({ type: 'int', nullable: true })
  maxClicks: number | null;

  @Column({ type: 'int', default: 0 })
  clicksCount: number;

  @Column({ type: 'int', default: 0 })
  successfulAccessCount: number;

  @Column({ type: 'boolean', default: false })
  isUsePassword: boolean;

  @Column({ type: 'enum', enum: LINK_STATUS, default: LINK_STATUS.ACTIVE })
  status: LINK_STATUS;

  @OneToMany(() => Click, (click) => click.link)
  clicks: Click[];

  @Column({ type: 'varchar', nullable: true })
  referrerId: string | null;

  @ManyToOne(() => Referrer, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'referrerId' })
  referrer: Referrer;

  @BeforeInsert()
  @BeforeUpdate()
  updateStatus() {
    if (this.expireAt && new Date(this.expireAt) < new Date()) {
      this.status = LINK_STATUS.EXPIRED;
    } else if (this.maxClicks && this.clicksCount >= this.maxClicks) {
      this.status = LINK_STATUS.LIMIT_REACHED;
    } else if (!this.status) {
      this.status = LINK_STATUS.ACTIVE;
    }
  }
}
