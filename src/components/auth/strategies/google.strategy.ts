import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { AuthConfig } from '@config/config.type';

export interface OAuthUser {
  oauthProvider: 'google' | 'facebook';
  oauthProviderId: string;
  email: string;
  fullname: string;
  refreshToken?: string;
  accessToken?: string;
  isEnable2FA?: boolean;
}
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.get<AuthConfig>('auth')?.google?.clientId || '',
      clientSecret:
        configService.get<AuthConfig>('auth')?.google?.clientSecret || '',
      callbackURL:
        configService.get<AuthConfig>('auth')?.google?.callbackUrl || '',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): Promise<OAuthUser> {
    console.log('profile', profile);
    const { name, emails, id } = profile;

    const user: OAuthUser = {
      oauthProvider: 'google',
      oauthProviderId: id,
      email: emails?.[0]?.value ?? '',
      fullname: `${name?.givenName ?? ''} ${name?.familyName ?? ''}`.trim(),
    };

    return await this.authService.validateOAuthLogin(user);
  }
}
