import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as twoFactor from 'node-2fa';

import { UserRepository } from '@database/repositories/user/user.repository';
import { AllConfigType } from '@config/config.type';
import { USER_ROLE_ENUM, IS_2FA_ENUM } from '@components/user/user.constant';
import { BOOLEAN_ENUM } from '@constant/app.enum';

@Injectable()
export class AdminInitService implements OnModuleInit {
  private readonly logger = new Logger(AdminInitService.name);

  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    private readonly userRepository: UserRepository,
  ) {}

  async onModuleInit() {
    await this.createAdminAccount();
  }

  private async createAdminAccount(): Promise<void> {
    try {
      const adminConfig = this.configService.get('admin', { infer: true });

      if (!adminConfig) {
        this.logger.warn(
          'Admin configuration not found, skipping admin account creation',
        );
        console.log(
          "'Admin configuration not found, skipping admin account creation',",
        );
        return;
      }

      const { name, email, password } = adminConfig;

      const existingAdmin = await this.userRepository.findByEmail(email);

      if (existingAdmin) {
        this.logger.log(`Admin account already exists with email: ${email}`);
        console.log(`Admin account already exists with email: ${email}`);
        return;
      }

      const { secret, qr, uri } = twoFactor.generateSecret();

      const adminUser = this.userRepository.create({
        fullname: name,
        email: email,
        password: password,
        role: USER_ROLE_ENUM.ADMIN,
        isActive: BOOLEAN_ENUM.TRUE,
        isLocked: BOOLEAN_ENUM.FALSE,
        isEnable2FA: IS_2FA_ENUM.DISABLED,
        twoFactorSecret: secret,
        twoFactorQr: qr,
        twoFactorUri: uri,
        createdBy: 'system',
      });

      await this.userRepository.save(adminUser);

      this.logger.log(
        `Admin account created successfully with email: ${email}`,
      );
      console.log(`Admin account created successfully with email: ${email}`);
    } catch (error) {
      this.logger.error('Failed to create admin account:', error);
      throw error;
    }
  }
}
