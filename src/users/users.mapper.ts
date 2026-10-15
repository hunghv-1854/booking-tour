import type { AuthenticatedUser } from '../auth/auth.types';
import { User } from './user.entity';
import { UserProfile } from './users.interface';

export function toAuthenticatedUser(user: User): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  };
}

export function toUserProfile(user: User, avatar: string | null): UserProfile {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    role: user.role,
    avatar,
  };
}
