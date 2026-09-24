import {
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { I18nService } from 'nestjs-i18n';
import { RedisService } from '../redis/redis.service';
import { User, UserStatus } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { toAuthenticatedUser } from '../users/users.mapper';
import { Duration, PASSWORD_SALT_ROUNDS } from './auth.constants';
import {
  JwtPayload,
  LoginResponse,
  LogoutResponse,
  RefreshTokenPayload,
  RegisterResponse,
  TokenPair,
} from './auth.types';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly i18n: I18nService,
    private readonly redisService: RedisService,
  ) {}

  async register(dto: RegisterDto): Promise<RegisterResponse> {
    await this.assertEmailIsFree(dto.email);

    const created = await this.usersService.create({
      email: dto.email,
      fullName: dto.fullName,
      password: await this.hashPassword(dto.password),
    });

    return {
      id: created.id,
      email: created.email,
      fullName: created.fullName,
      role: created.role,
      createdAt: created.createdAt,
    };
  }

  async login(dto: LoginDto): Promise<LoginResponse> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException({
        errors: { email: [this.i18n.t('auth.email_not_found')] },
      });
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException({
        errors: { password: [this.i18n.t('auth.invalid_password')] },
      });
    }

    if (user.status === UserStatus.LOCKED) {
      throw new UnauthorizedException({
        errors: { email: [this.i18n.t('auth.account_locked')] },
      });
    }

    return {
      ...(await this.issueTokenPair(user)),
      user: toAuthenticatedUser(user),
    };
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    const payload = await this.verifyRefreshToken(refreshToken).catch(() => {
      throw new UnauthorizedException();
    });

    const ownerId = await this.redisService.getRefreshTokenOwner(payload.jti);
    if (ownerId === null || ownerId !== payload.sub) {
      throw new UnauthorizedException();
    }
    // Rotation: revoke the old refresh token immediately on every refresh.
    await this.redisService.revokeRefreshToken(payload.jti);

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }

    return this.issueTokenPair(user);
  }

  async logout(
    accessToken: string | null,
    refreshToken?: string,
  ): Promise<LogoutResponse> {
    if (!accessToken) {
      throw new UnauthorizedException();
    }

    const payload = this.jwtService.decode<JwtPayload>(accessToken);
    if (payload?.exp) {
      const secondsUntilExpiry = payload.exp - Math.floor(Date.now() / 1000);
      await this.redisService.blacklistToken(payload.jti, secondsUntilExpiry);
    }

    if (refreshToken) {
      try {
        const refreshPayload = await this.verifyRefreshToken(refreshToken);
        await this.redisService.revokeRefreshToken(refreshPayload.jti);
      } catch {
        // Invalid/expired refresh token — nothing to revoke, ignore.
      }
    }

    return { message: this.i18n.t('auth.logged_out') };
  }

  private async issueTokenPair(user: User): Promise<TokenPair> {
    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      jti: randomUUID(),
    };
    const accessToken = this.jwtService.sign(accessPayload);

    const refreshJti = randomUUID();
    const refreshPayload: RefreshTokenPayload = {
      sub: user.id,
      jti: refreshJti,
    };
    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ??
        '7d') as Duration,
    });

    const decoded = this.jwtService.decode<RefreshTokenPayload>(refreshToken);
    if (decoded?.exp) {
      const ttlSeconds = decoded.exp - Math.floor(Date.now() / 1000);
      await this.redisService.storeRefreshToken(
        refreshJti,
        user.id,
        ttlSeconds,
      );
    }

    return { accessToken, refreshToken };
  }

  private verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    return this.jwtService.verifyAsync<RefreshTokenPayload>(token, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
    });
  }

  private async assertEmailIsFree(email: string): Promise<void> {
    const emailTaken = await this.usersService.existsByEmail(email);
    if (emailTaken) {
      throw new UnprocessableEntityException({
        errors: { email: [this.i18n.t('auth.email_taken')] },
      });
    }
  }

  private hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, PASSWORD_SALT_ROUNDS);
  }
}
