import { Entity, Column, BeforeInsert, BeforeUpdate } from 'typeorm';
import { BaseModel } from '@core/schema/base.model';
import bcrypt from 'bcrypt';
import { IS_2FA_ENUM } from '@components/user/user.constant';

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

  @Column({
    type: 'int',
    enum: IS_2FA_ENUM,
    default: IS_2FA_ENUM.DISABLED,
    nullable: true,
  })
  isEnable2FA: IS_2FA_ENUM;

  @Column({ nullable: true })
  resetPasswordToken: string;

  @Column({ type: 'timestamp', nullable: true })
  resetPasswordExpires: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isLocked: boolean;

  @Column({ nullable: true })
  refreshToken: string;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    console.log('HashPassword called');
    console.log('thisPassword', this.password);
    if (this.password && !this.password.startsWith('$2b$')) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
  }
}
