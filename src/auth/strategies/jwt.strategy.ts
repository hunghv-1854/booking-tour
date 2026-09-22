import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { RedisService } from '../../redis/redis.service';
import { User, UserStatus } from '../../users/user.entity';
import { UsersService } from '../../users/users.service';
import { extractJwtFromAuthHeader } from '../auth.constants';
import { JwtPayload } from '../auth.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly redisService: RedisService,
  ) {
    super({
      jwtFromRequest: extractJwtFromAuthHeader,
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const [user, revoked] = await Promise.all([
      this.usersService.findById(payload.sub),
      this.redisService.isTokenBlacklisted(payload.jti),
    ]);

    if (!user || revoked || user.status === UserStatus.LOCKED) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
