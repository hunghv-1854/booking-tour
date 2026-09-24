import { UserRole } from '../user.entity';

export interface CreateUserDto {
  email: string;
  password: string;
  fullName: string;
  role?: UserRole;
}
