import { Entity, Column, BeforeInsert, BeforeUpdate, OneToMany } from 'typeorm';
import { BaseModel } from '@core/schema/base.model';
import bcrypt from 'bcrypt';
import {
  IS_2FA_ENUM,
  USER_GENDER_ENUM,
  USER_LOCKED_ENUM,
  USER_ROLE_ENUM,
} from '@components/user/user.constant';
import { BOOLEAN_ENUM } from '@constant/app.enum';
import { Link } from './link.entity';
import { Referrer } from './referrer.entity';

@Entity('users')
export class User extends BaseModel {
  @Column({ nullable: true })
  oauthProvider?: string;

  @Column({ nullable: true })
  oauthProviderId?: string;

  @Column({ length: 100, nullable: true })
  fullname: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ type: 'int', enum: USER_ROLE_ENUM, default: USER_ROLE_ENUM.USER })
  role: USER_ROLE_ENUM;

  @Column({
    type: 'int',
    enum: USER_GENDER_ENUM,
    default: USER_GENDER_ENUM.MALE,
  })
  gender: USER_GENDER_ENUM;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ nullable: true })
  avatar: string;

  @Column({ nullable: true })
  createdBy: string;

  @Column({ nullable: true })
  twoFactorSecret: string;

  @Column({ nullable: true })
  twoFactorQr: string;

  @Column({ nullable: true })
  twoFactorUri: string;

  @Column({
    type: 'int',
    enum: IS_2FA_ENUM,
    default: IS_2FA_ENUM.DISABLED,
  })
  isEnable2FA: IS_2FA_ENUM;

  @Column({ type: 'int', enum: BOOLEAN_ENUM, default: BOOLEAN_ENUM.TRUE })
  isActive: BOOLEAN_ENUM;

  @Column({ type: 'int', enum: BOOLEAN_ENUM, default: BOOLEAN_ENUM.FALSE })
  isVerified: BOOLEAN_ENUM;

  @Column({
    type: 'int',
    enum: USER_LOCKED_ENUM,
    default: USER_LOCKED_ENUM.UNLOCKED,
  })
  isLocked: USER_LOCKED_ENUM;

  @Column({ nullable: true })
  refreshToken: string;

  @OneToMany(() => Link, (link) => link.user)
  links: Link[];

  @OneToMany(() => Referrer, (referrer) => referrer.user)
  referrers: Referrer[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    console.log('hashPassword');
    if (this.password && !this.password.startsWith('$2b$')) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
  }
}
