// src/i18n/i18n.module.ts
import { Module } from '@nestjs/common';
import {
  I18nModule as NestI18nModule,
  I18nJsonLoader,
  QueryResolver,
  AcceptLanguageResolver,
  HeaderResolver,
  CookieResolver,
} from 'nestjs-i18n';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as path from 'path';
import { AllConfigType } from '../config/config.type';

@Module({
  imports: [
    ConfigModule,
    NestI18nModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AllConfigType>) => ({
        fallbackLanguage: configService.getOrThrow('app.fallbackLanguage', {
          infer: true,
        }),
        loader: I18nJsonLoader,
        loaderOptions: {
          path: path.join(process.cwd(), 'src', 'i18n'),
          watch: true,
        },
      }),
      resolvers: [
        new CookieResolver(),
        AcceptLanguageResolver,
        new HeaderResolver(['x-lang']),
        { use: QueryResolver, options: ['lang', 'locale', 'l'] },
      ],
    }),
  ],
  exports: [NestI18nModule],
})
export class I18nModule {}
