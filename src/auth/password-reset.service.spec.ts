import { UnprocessableEntityException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { I18nService } from 'nestjs-i18n';
import { createI18nMock } from '../common/testing/i18n.mock';
import { AccountNotificationTemplate } from '../notifications/account-notification-template.enum';
import { AccountNotificationService } from '../notifications/account-notification.service';
import { RedisService } from '../redis/redis.service';
import { UserStatus } from '../users/user-status.enum';
import { UsersService } from '../users/users.service';
import {
  ACCOUNT_SETUP_TTL_SECONDS,
  PASSWORD_RESET_TTL_SECONDS,
} from './auth.constants';
import { PasswordResetService } from './password-reset.service';
import { hashResetToken } from './password.util';

describe('PasswordResetService', () => {
  let service: PasswordResetService;
  const usersService = { findByEmail: jest.fn(), updatePassword: jest.fn() };
  const redisService = {
    storePasswordResetToken: jest.fn(),
    consumePasswordResetToken: jest.fn(),
  };
  const notifications = { sendPasswordToken: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        PasswordResetService,
        { provide: UsersService, useValue: usersService },
        { provide: RedisService, useValue: redisService },
        { provide: AccountNotificationService, useValue: notifications },
        { provide: I18nService, useValue: createI18nMock() },
      ],
    }).compile();
    service = moduleRef.get(PasswordResetService);
  });

  describe('requestReset', () => {
    it('stores only the token hash and emails the raw token to an active user', async () => {
      usersService.findByEmail.mockResolvedValue({
        id: 7,
        status: UserStatus.ACTIVE,
      });

      const result = await service.requestReset({ email: 'an@example.com' });

      expect(result).toEqual({ message: 'auth.reset_password_requested' });
      const [userId, template, token, ttl] = notifications.sendPasswordToken
        .mock.calls[0] as [number, AccountNotificationTemplate, string, number];
      expect([userId, template, ttl]).toEqual([
        7,
        AccountNotificationTemplate.PASSWORD_RESET,
        PASSWORD_RESET_TTL_SECONDS,
      ]);
      expect(token).toMatch(/^[0-9a-f]{64}$/);
      expect(redisService.storePasswordResetToken).toHaveBeenCalledWith(
        hashResetToken(token),
        7,
        PASSWORD_RESET_TTL_SECONDS,
      );
    });

    it.each([
      ['an unknown email', null],
      ['a locked account', { id: 7, status: UserStatus.LOCKED }],
    ])(
      'returns the same message without emailing for %s',
      async (_case, user) => {
        usersService.findByEmail.mockResolvedValue(user);

        await expect(
          service.requestReset({ email: 'x@example.com' }),
        ).resolves.toEqual({ message: 'auth.reset_password_requested' });
        expect(notifications.sendPasswordToken).not.toHaveBeenCalled();
        expect(redisService.storePasswordResetToken).not.toHaveBeenCalled();
      },
    );
  });

  it('sends an account setup token valid for 24 hours', async () => {
    await service.sendAccountSetup(3);

    expect(notifications.sendPasswordToken).toHaveBeenCalledWith(
      3,
      AccountNotificationTemplate.ACCOUNT_SETUP,
      expect.any(String),
      ACCOUNT_SETUP_TTL_SECONDS,
    );
  });

  describe('reset', () => {
    it('consumes the token hash and stores the new password hash', async () => {
      redisService.consumePasswordResetToken.mockResolvedValue(7);

      const result = await service.reset({
        token: 'raw-token',
        newPassword: 'N3w-Str0ng-Pass',
      });

      expect(result).toEqual({ message: 'auth.password_reset' });
      expect(redisService.consumePasswordResetToken).toHaveBeenCalledWith(
        hashResetToken('raw-token'),
      );
      const [userId, hash] = usersService.updatePassword.mock.calls[0] as [
        number,
        string,
      ];
      expect(userId).toBe(7);
      expect(await bcrypt.compare('N3w-Str0ng-Pass', hash)).toBe(true);
    });

    it('rejects an invalid, expired or already used token', async () => {
      redisService.consumePasswordResetToken.mockResolvedValue(null);

      await expect(
        service.reset({ token: 'used', newPassword: 'N3w-Str0ng-Pass' }),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
      expect(usersService.updatePassword).not.toHaveBeenCalled();
    });
  });
});
