import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { AllConfigType, AppConfig } from '@config/config.type';
import { I18nService } from 'nestjs-i18n';
import { I18nMailKeys } from '@constant/i18n-keys.enum';

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
    const appConfig = this.configService.get<AppConfig>('app');

    const resetUrl = `${appConfig?.frontendUrl}/reset-password?token=${resetToken}`;

    const subject = this.i18n.translate(I18nMailKeys.RESET_PASSWORD_SUBJECT);
    const expirationTime = this.i18n.translate(
      I18nMailKeys.RESET_PASSWORD_EXPIRATION,
    );
    const resetPasswordGreeting = this.i18n.translate(
      I18nMailKeys.RESET_PASSWORD_GREETING,
    );
    const resetPasswordMessage = this.i18n.translate(
      I18nMailKeys.RESET_PASSWORD_MESSAGE,
    );
    const resetPasswordButton = this.i18n.translate(
      I18nMailKeys.RESET_PASSWORD_BUTTON,
    );
    const resetPasswordExpiryNote = this.i18n.translate(
      I18nMailKeys.RESET_PASSWORD_EXPIRY_NOTE,
    );
    const resetPasswordIgnore = this.i18n.translate(
      I18nMailKeys.RESET_PASSWORD_IGNORE,
    );

    await this.mailerService.sendMail({
      to: email,
      subject,
      template: 'reset-password',
      context: {
        fullname,
        resetUrl,
        appName: appConfig?.appName,
        expirationTime,
        lang: lang || appConfig?.fallbackLanguage,
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

    const subject = this.i18n.translate(
      I18nMailKeys.RESET_PASSWORD_SUCCESS_SUBJECT,
    );
    const resetPasswordGreeting = this.i18n.translate(
      I18nMailKeys.RESET_PASSWORD_GREETING,
    );
    const resetPasswordSuccessMessage = this.i18n.translate(
      I18nMailKeys.RESET_PASSWORD_SUCCESS_MESSAGE,
    );
    const resetPasswordSuccessLogin = this.i18n.translate(
      I18nMailKeys.RESET_PASSWORD_SUCCESS_LOGIN,
    );
    const resetPasswordSuccessSecurity = this.i18n.translate(
      I18nMailKeys.RESET_PASSWORD_SUCCESS_SECURITY,
    );

    await this.mailerService.sendMail({
      to: email,
      subject,
      template: 'reset-password-success',
      context: {
        fullname,
        appName: appConfig?.appName,
        lang: lang || appConfig?.fallbackLanguage,
        resetPasswordSuccessSubject: subject,
        resetPasswordGreeting,
        resetPasswordSuccessMessage,
        resetPasswordSuccessLogin,
        resetPasswordSuccessSecurity,
      },
    });
  }
}
