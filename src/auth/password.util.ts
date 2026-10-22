import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import {
  PASSWORD_RESET_TOKEN_BYTES,
  PASSWORD_SALT_ROUNDS,
} from './auth.constants';

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, PASSWORD_SALT_ROUNDS);
}

export function generateResetToken(): string {
  return randomBytes(PASSWORD_RESET_TOKEN_BYTES).toString('hex');
}

export function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
