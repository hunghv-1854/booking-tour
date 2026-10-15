import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GOOGLE_STRATEGY } from '../auth.constants';

@Injectable()
export class GoogleAuthGuard extends AuthGuard(GOOGLE_STRATEGY) {
  handleRequest<TUser>(error: unknown, user: TUser | false): TUser {
    if (error instanceof UnauthorizedException) throw error;
    if (error || !user) throw new UnauthorizedException();
    return user;
  }
}
