import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { I18nService } from 'nestjs-i18n';
import { createI18nMock } from '../common/testing/i18n.mock';
import { RedisService } from '../redis/redis.service';
import { OAuthProvider } from '../users/oauth-provider.enum';
import { UserRole } from '../users/user-role.enum';
import { UserStatus } from '../users/user-status.enum';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  const usersService = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    findOrCreateByOAuth: jest.fn(),
    findCredentialsById: jest.fn(),
    updatePassword: jest.fn(),
  };
  const jwtService = {
    sign: jest.fn().mockReturnValue('signed-token'),
    decode: jest
      .fn()
      .mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 60 }),
    verifyAsync: jest.fn(),
  };
  const redisService = {
    getRefreshTokenOwner: jest.fn(),
    revokeRefreshToken: jest.fn(),
    storeRefreshToken: jest.fn(),
    blacklistToken: jest.fn(),
  };
  const user = {
    id: 7,
    email: 'an@example.com',
    fullName: 'An',
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    password: bcrypt.hashSync('Passw0rd!', 4),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        {
          provide: ConfigService,
          useValue: { get: jest.fn(), getOrThrow: jest.fn(() => 'secret') },
        },
        { provide: I18nService, useValue: createI18nMock() },
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  describe('login', () => {
    it('rejects an unknown email', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'x@x.com', password: 'Passw0rd!' }),
      ).rejects.toMatchObject({
        response: { errors: { email: ['auth.email_not_found'] } },
      });
    });

    it('rejects a wrong password', async () => {
      usersService.findByEmail.mockResolvedValue(user);

      await expect(
        service.login({ email: user.email, password: 'wrong' }),
      ).rejects.toMatchObject({
        response: { errors: { password: ['auth.invalid_password'] } },
      });
    });

    it('rejects a locked account', async () => {
      usersService.findByEmail.mockResolvedValue({
        ...user,
        status: UserStatus.LOCKED,
      });

      await expect(
        service.login({ email: user.email, password: 'Passw0rd!' }),
      ).rejects.toMatchObject({
        response: { errors: { email: ['auth.account_locked'] } },
      });
    });

    it('issues a token pair, stores the refresh jti and hides the password', async () => {
      usersService.findByEmail.mockResolvedValue(user);

      const result = await service.login({
        email: user.email,
        password: 'Passw0rd!',
      });

      expect(result.accessToken).toBe('signed-token');
      expect(result.user).not.toHaveProperty('password');
      expect(redisService.storeRefreshToken).toHaveBeenCalledWith(
        expect.any(String),
        7,
        expect.any(Number),
      );
    });
  });

  describe('loginWithOAuth', () => {
    const profile = {
      provider: OAuthProvider.GOOGLE,
      providerUserId: 'google-123',
      email: user.email,
      fullName: user.fullName,
    };

    it('issues a token pair for the linked or created user', async () => {
      usersService.findOrCreateByOAuth.mockResolvedValue(user);

      const result = await service.loginWithOAuth(profile);

      expect(usersService.findOrCreateByOAuth).toHaveBeenCalledWith(
        profile,
        expect.any(Function),
      );
      expect(result.user).toEqual({
        id: 7,
        email: user.email,
        fullName: user.fullName,
        role: UserRole.USER,
      });
      expect(redisService.storeRefreshToken).toHaveBeenCalled();
    });

    it('hashes a random password only when a new user is created', async () => {
      usersService.findOrCreateByOAuth.mockImplementation(
        async (_profile, generatePassword: () => Promise<string>) => {
          const hash = await generatePassword();
          expect(await bcrypt.compare('Passw0rd!', hash)).toBe(false);
          return user;
        },
      );

      await service.loginWithOAuth(profile);
    });

    it('rejects a locked account', async () => {
      usersService.findOrCreateByOAuth.mockResolvedValue({
        ...user,
        status: UserStatus.LOCKED,
      });

      await expect(service.loginWithOAuth(profile)).rejects.toMatchObject({
        response: { errors: { email: ['auth.account_locked'] } },
      });
      expect(redisService.storeRefreshToken).not.toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    it('rejects a wrong current password on the currentPassword field', async () => {
      usersService.findCredentialsById.mockResolvedValue(user);

      await expect(
        service.changePassword(7, {
          currentPassword: 'wrong',
          newPassword: 'N3w-Str0ng-Pass',
        }),
      ).rejects.toMatchObject({
        response: {
          errors: { currentPassword: ['auth.invalid_current_password'] },
        },
      });
      expect(usersService.updatePassword).not.toHaveBeenCalled();
    });

    it('rejects reusing the current password', async () => {
      usersService.findCredentialsById.mockResolvedValue(user);

      await expect(
        service.changePassword(7, {
          currentPassword: 'Passw0rd!',
          newPassword: 'Passw0rd!',
        }),
      ).rejects.toMatchObject({
        response: { errors: { newPassword: ['auth.same_password'] } },
      });
    });

    it('stores the new hash and clears the forced change flag', async () => {
      usersService.findCredentialsById.mockResolvedValue(user);

      const result = await service.changePassword(7, {
        currentPassword: 'Passw0rd!',
        newPassword: 'N3w-Str0ng-Pass',
      });

      expect(result).toEqual({ message: 'auth.password_changed' });
      const [, hash] = usersService.updatePassword.mock.calls[0] as [
        number,
        string,
      ];
      expect(await bcrypt.compare('N3w-Str0ng-Pass', hash)).toBe(true);
    });
  });

  describe('refresh', () => {
    it('rejects an invalid refresh token', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('invalid'));

      await expect(service.refresh('bad')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects a refresh token that was already rotated or revoked', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: 7, jti: 'old' });
      redisService.getRefreshTokenOwner.mockResolvedValue(null);

      await expect(service.refresh('token')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(redisService.revokeRefreshToken).not.toHaveBeenCalled();
    });

    it('revokes the old jti before issuing a new pair', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: 7, jti: 'old' });
      redisService.getRefreshTokenOwner.mockResolvedValue(7);
      usersService.findById.mockResolvedValue(user);

      await service.refresh('token');

      expect(redisService.revokeRefreshToken).toHaveBeenCalledWith('old');
      expect(redisService.storeRefreshToken).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('blacklists the access token jti until it expires', async () => {
      const exp = Math.floor(Date.now() / 1000) + 120;
      jwtService.decode.mockReturnValueOnce({ jti: 'access-jti', exp });

      await service.logout('access-token');

      expect(redisService.blacklistToken).toHaveBeenCalledWith(
        'access-jti',
        expect.any(Number),
      );
    });

    it('requires an access token', async () => {
      await expect(service.logout(null)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });
});
