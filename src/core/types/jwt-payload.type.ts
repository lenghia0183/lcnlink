export interface JwtPayload {
  id: string;
  role?: number;
  email?: string;
  isAdmin?: boolean;
}
