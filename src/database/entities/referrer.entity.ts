import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseModel } from '@core/schema/base.model';
import { User } from './user.entity';

@Entity('referrers')
export class Referrer extends BaseModel {
  @Column({ type: 'varchar', length: 255, unique: true })
  referrer: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  alias: string;

  @Column({ type: 'varchar', nullable: true })
  userId: string | null;

  @ManyToOne(() => User, (user: User) => user.referrers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;
}
