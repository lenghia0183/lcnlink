import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { AllConfigType } from '@config/config.type';
import { MailService } from './mail.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService<AllConfigType>) => {
        const mailConfig = configService.get('mail', { infer: true });

        return {
          transport: {
            host: mailConfig?.host,
            port: mailConfig?.port,
            secure: false,
            auth: {
              user: mailConfig?.user,
              pass: mailConfig?.password,
            },
          },
          defaults: {
            from: `"${mailConfig?.fromName}" <${mailConfig?.from}>`,
          },
          template: {
            dir: join(process.cwd(), 'src', 'components', 'mail', 'templates'),
            adapter: new HandlebarsAdapter(),
            options: {
              strict: false,
            },
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
