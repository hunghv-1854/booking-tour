import { ExtractJwt } from 'passport-jwt';

export const JWT_AUTH_SCHEME = 'Token';
export const extractJwtFromAuthHeader =
  ExtractJwt.fromAuthHeaderWithScheme(JWT_AUTH_SCHEME);

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;
export const PASSWORD_SALT_ROUNDS = 10;

export const PASSWORD_RESET_TOKEN_BYTES = 32;
export const PASSWORD_RESET_TTL_SECONDS = 30 * 60;
export const ACCOUNT_SETUP_TTL_SECONDS = 24 * 60 * 60;

/** Matches the duration strings accepted by `jsonwebtoken`'s `expiresIn`, e.g. '15m', '7d'. */
export type Duration = `${number}${'s' | 'm' | 'h' | 'd' | 'w' | 'y'}`;

export const GOOGLE_STRATEGY = 'google';
export const GOOGLE_SCOPES = ['email', 'profile'];
