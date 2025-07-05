import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '@config/config.type';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService<AllConfigType>,
    private readonly i18n: I18nService,
  ) {}

  async sendPasswordResetEmail(
    email: string,
    fullname: string,
    resetToken: string,
    lang?: string,
  ): Promise<void> {
    const appConfig = this.configService.get('app', { infer: true });
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    // Get localized subject and content
    const subject = this.i18n.translate('mail.RESET_PASSWORD_SUBJECT', {
      lang,
    });
    const expirationTime = this.i18n.translate(
      'mail.RESET_PASSWORD_EXPIRATION',
      { lang },
    );
    const resetPasswordGreeting = this.i18n.translate(
      'mail.RESET_PASSWORD_GREETING',
      { lang },
    );
    const resetPasswordMessage = this.i18n.translate(
      'mail.RESET_PASSWORD_MESSAGE',
      { lang },
    );
    const resetPasswordButton = this.i18n.translate(
      'mail.RESET_PASSWORD_BUTTON',
      { lang },
    );
    const resetPasswordExpiryNote = this.i18n.translate(
      'mail.RESET_PASSWORD_EXPIRY_NOTE',
      { lang },
    );
    const resetPasswordIgnore = this.i18n.translate(
      'mail.RESET_PASSWORD_IGNORE',
      { lang },
    );

    await this.mailerService.sendMail({
      to: email,
      subject,
      template: 'reset-password',
      context: {
        fullname,
        resetUrl,
        appName: appConfig?.appName || 'Your App',
        expirationTime,
        lang: lang || 'vi',
        resetPasswordSubject: subject,
        resetPasswordGreeting,
        resetPasswordMessage,
        resetPasswordButton,
        resetPasswordExpiryNote,
        resetPasswordIgnore,
      },
    });
  }

  async sendPasswordResetSuccessEmail(
    email: string,
    fullname: string,
    lang?: string,
  ): Promise<void> {
    const appConfig = this.configService.get('app', { infer: true });

    // Get localized subject and content
    const subject = this.i18n.translate('mail.RESET_PASSWORD_SUCCESS_SUBJECT', {
      lang,
    });
    const resetPasswordGreeting = this.i18n.translate(
      'mail.RESET_PASSWORD_GREETING',
      { lang },
    );
    const resetPasswordSuccessMessage = this.i18n.translate(
      'mail.RESET_PASSWORD_SUCCESS_MESSAGE',
      { lang },
    );
    const resetPasswordSuccessLogin = this.i18n.translate(
      'mail.RESET_PASSWORD_SUCCESS_LOGIN',
      { lang },
    );
    const resetPasswordSuccessSecurity = this.i18n.translate(
      'mail.RESET_PASSWORD_SUCCESS_SECURITY',
      { lang },
    );

    await this.mailerService.sendMail({
      to: email,
      subject,
      template: 'reset-password-success',
      context: {
        fullname,
        appName: appConfig?.appName || 'Your App',
        lang: lang || 'vi',
        resetPasswordSuccessSubject: subject,
        resetPasswordGreeting,
        resetPasswordSuccessMessage,
        resetPasswordSuccessLogin,
        resetPasswordSuccessSecurity,
      },
    });
  }
}
