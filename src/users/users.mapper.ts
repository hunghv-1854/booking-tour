import type { AuthenticatedUser } from '../auth/auth.types';
import { User } from './user.entity';

export function toAuthenticatedUser(user: User): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  };
}
