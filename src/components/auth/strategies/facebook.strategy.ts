import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { AuthConfig } from '@config/config.type';
import { OAuthUser, OAuthValidationResult } from './google.strategy';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.get<AuthConfig>('auth')?.facebook?.clientId || '',
      clientSecret:
        configService.get<AuthConfig>('auth')?.facebook?.clientSecret || '',
      callbackURL:
        configService.get<AuthConfig>('auth')?.facebook?.callbackUrl || '',
      profileFields: ['id', 'emails', 'name'],
      scope: ['email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): Promise<OAuthValidationResult> {
    console.log(profile);
    const { name, emails, id } = profile;

    const user: OAuthUser = {
      oauthProvider: 'facebook',
      oauthProviderId: id,
      email: emails?.[0]?.value ?? '',
      fullname: `${name?.givenName ?? ''} ${name?.familyName ?? ''}`.trim(),
    };

    return await this.authService.validateOAuthLogin(user);
  }
}
