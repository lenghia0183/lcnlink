import { USER_ROLE_ENUM } from '@components/user/user.constant';

export interface JwtPayload {
  id: string;
  role: USER_ROLE_ENUM;
  email: string;
  fullname: string;
}
