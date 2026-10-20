import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { fieldError } from '../common/validation/field-error.util';
import { AccountNotificationTemplate } from '../notifications/account-notification-template.enum';
import { AccountNotificationService } from '../notifications/account-notification.service';
import { RedisService } from '../redis/redis.service';
import { UserStatus } from '../users/user-status.enum';
import { UsersService } from '../users/users.service';
import {
  ACCOUNT_SETUP_TTL_SECONDS,
  PASSWORD_RESET_TTL_SECONDS,
} from './auth.constants';
import { PasswordResetResponse } from './auth.types';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import {
  generateResetToken,
  hashPassword,
  hashResetToken,
} from './password.util';

@Injectable()
export class PasswordResetService {
  constructor(
    private readonly usersService: UsersService,
    private readonly redisService: RedisService,
    private readonly accountNotificationService: AccountNotificationService,
    private readonly i18n: I18nService,
  ) {}

  async requestReset({
    email,
  }: ForgotPasswordDto): Promise<PasswordResetResponse> {
    const user = await this.usersService.findByEmail(email);
    if (user && user.status === UserStatus.ACTIVE) {
      await this.issueToken(
        user.id,
        AccountNotificationTemplate.PASSWORD_RESET,
        PASSWORD_RESET_TTL_SECONDS,
      );
    }
    return { message: this.i18n.t('auth.reset_password_requested') };
  }

  sendAccountSetup(userId: number): Promise<void> {
    return this.issueToken(
      userId,
      AccountNotificationTemplate.ACCOUNT_SETUP,
      ACCOUNT_SETUP_TTL_SECONDS,
    );
  }

  async reset({
    token,
    newPassword,
  }: ResetPasswordDto): Promise<PasswordResetResponse> {
    const userId = await this.redisService.consumePasswordResetToken(
      hashResetToken(token),
    );
    if (userId === null) {
      throw fieldError('token', this.i18n.t('auth.invalid_reset_token'));
    }

    await this.usersService.updatePassword(
      userId,
      await hashPassword(newPassword),
    );
    return { message: this.i18n.t('auth.password_reset') };
  }

  private async issueToken(
    userId: number,
    template: AccountNotificationTemplate,
    ttlSeconds: number,
  ): Promise<void> {
    const token = generateResetToken();
    await this.redisService.storePasswordResetToken(
      hashResetToken(token),
      userId,
      ttlSeconds,
    );
    await this.accountNotificationService.sendPasswordToken(
      userId,
      template,
      token,
      ttlSeconds,
    );
  }
}
