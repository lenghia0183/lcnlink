import { Entity, Column, BeforeInsert, BeforeUpdate } from 'typeorm';
import { BaseModel } from '@core/schema/base.model';
import bcrypt from 'bcrypt';
import {
  IS_2FA_ENUM,
  USER_GENDER_ENUM,
  USER_ROLE_ENUM,
} from '@components/user/user.constant';
import { BOOLEAN_ENUM } from '@constant/app.enum';

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

  @Column({ type: 'int', enum: BOOLEAN_ENUM, default: BOOLEAN_ENUM.TRUE })
  isLocked: BOOLEAN_ENUM;

  @Column({ nullable: true })
  refreshToken: string;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && !this.password.startsWith('$2b$')) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  // Method to manually hash password when lifecycle hooks don't work
  async setAndHashPassword(plainPassword: string): Promise<void> {
    if (plainPassword && !plainPassword.startsWith('$2b$')) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(plainPassword, salt);
    } else {
      this.password = plainPassword;
    }
  }
}
