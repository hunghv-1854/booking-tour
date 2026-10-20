import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { I18nService } from 'nestjs-i18n';
import { Repository } from 'typeorm';
import { MailService } from '../mail/mail.service';
import { User } from '../users/user.entity';
import {
  ACCOUNT_NOTIFICATION_QUEUE,
  ACCOUNT_NOTIFICATION_USER_SELECT,
} from './notifications.constants';
import { AccountNotificationJob } from './notifications.interface';

@Processor(ACCOUNT_NOTIFICATION_QUEUE)
export class AccountNotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(AccountNotificationProcessor.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
    private readonly i18n: I18nService,
  ) {
    super();
  }

  async process({ data }: Job<AccountNotificationJob>): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: { id: data.userId },
      select: ACCOUNT_NOTIFICATION_USER_SELECT,
    });
    if (!user) {
      this.logger.warn(`User #${data.userId} not found, skip email`);
      return;
    }

    const resetUrl = this.configService.get<string>('PASSWORD_RESET_URL');
    const args = {
      fullName: user.fullName,
      token: data.token,
      ttlMinutes: data.ttlMinutes,
      link: resetUrl ? `${resetUrl}?token=${data.token}\n\n` : '',
    };
    const t = (key: string) =>
      this.i18n.t(`mail.${data.template}_${key}`, { lang: data.lang, args });

    await this.mailService.send({
      to: user.email,
      subject: t('subject'),
      text: t('body'),
    });
    this.logger.log(`Sent ${data.template} email to user #${user.id}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<AccountNotificationJob> | undefined, error: Error): void {
    this.logger.error(
      `Failed to send ${job?.data.template} email to user #${job?.data.userId} (attempt ${job?.attemptsMade}/${job?.opts.attempts}): ${error.message}`,
    );
  }
}
