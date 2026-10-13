import { UserRole } from './user-role.enum';

export interface UserProfile {
  id: number;
  email: string;
  fullName: string;
  phone: string | null;
  role: UserRole;
  avatar: string | null;
}
