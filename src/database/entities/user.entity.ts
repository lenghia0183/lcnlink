import { Entity, Column } from 'typeorm';
import { BaseModel } from '@core/schema/base.model';

@Entity('users')
export class User extends BaseModel {
  @Column({ length: 100, nullable: true })
  fullname: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ type: 'int', nullable: true })
  role: number;

  @Column({ type: 'int', nullable: true })
  gender: number;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ nullable: true })
  avatar: string;

  @Column({ nullable: true })
  createdBy: string;

  @Column({ nullable: true })
  twoFactorSecret: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isLocked: boolean;
}
