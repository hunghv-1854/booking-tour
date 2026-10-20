import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { I18nContext } from 'nestjs-i18n';
import { AccountNotificationTemplate } from './account-notification-template.enum';
import {
  ACCOUNT_NOTIFICATION_JOB,
  ACCOUNT_NOTIFICATION_JOB_OPTIONS,
  ACCOUNT_NOTIFICATION_QUEUE,
  DEFAULT_MAIL_LANG,
} from './notifications.constants';
import { AccountNotificationJob } from './notifications.interface';

@Injectable()
export class AccountNotificationService {
  constructor(
    @InjectQueue(ACCOUNT_NOTIFICATION_QUEUE)
    private readonly queue: Queue<AccountNotificationJob>,
  ) {}

  async sendPasswordToken(
    userId: number,
    template: AccountNotificationTemplate,
    token: string,
    ttlSeconds: number,
  ): Promise<void> {
    await this.queue.add(
      ACCOUNT_NOTIFICATION_JOB,
      {
        userId,
        template,
        token,
        ttlMinutes: Math.round(ttlSeconds / 60),
        lang: I18nContext.current()?.lang ?? DEFAULT_MAIL_LANG,
      },
      ACCOUNT_NOTIFICATION_JOB_OPTIONS,
    );
  }
}
