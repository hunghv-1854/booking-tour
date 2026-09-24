import { UserRole } from '../users/user.entity';

export interface JwtPayload {
  sub: number;
  email: string;
  jti: string;
  exp?: number;
}

export interface RefreshTokenPayload {
  sub: number;
  jti: string;
  exp?: number;
}

export interface AuthenticatedUser {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse extends TokenPair {
  user: AuthenticatedUser;
}

export interface RegisterResponse {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: Date;
}

export interface LogoutResponse {
  message: string;
}
