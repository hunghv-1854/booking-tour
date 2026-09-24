import { ExtractJwt } from 'passport-jwt';

export const JWT_AUTH_SCHEME = 'Token';
export const extractJwtFromAuthHeader =
  ExtractJwt.fromAuthHeaderWithScheme(JWT_AUTH_SCHEME);

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;
export const PASSWORD_SALT_ROUNDS = 10;

/** Matches the duration strings accepted by `jsonwebtoken`'s `expiresIn`, e.g. '15m', '7d'. */
export type Duration = `${number}${'s' | 'm' | 'h' | 'd' | 'w' | 'y'}`;
