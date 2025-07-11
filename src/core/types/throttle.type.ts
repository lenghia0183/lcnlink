import { USER_ROLE_ENUM } from '@components/user/user.constant';

export type ThrottleTtlByRole =
  | number
  | 'unlimited'
  | {
      [USER_ROLE_ENUM.USER]?: number;
      [USER_ROLE_ENUM.ADMIN]?: number;
      [USER_ROLE_ENUM.GUEST]?: number;
    };

export type ThrottleLimitByRole =
  | number
  | 'unlimited'
  | {
      [USER_ROLE_ENUM.USER]?: number;
      [USER_ROLE_ENUM.ADMIN]?: number;
      [USER_ROLE_ENUM.GUEST]?: number;
    };

export interface ThrottleByRoleOptions {
  ttl: ThrottleTtlByRole;
  limits: ThrottleLimitByRole;
}
