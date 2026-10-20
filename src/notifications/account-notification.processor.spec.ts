import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { I18nService } from 'nestjs-i18n';
import { createI18nMock } from '../common/testing/i18n.mock';
import { MailService } from '../mail/mail.service';
import { User } from '../users/user.entity';
import { AccountNotificationTemplate } from './account-notification-template.enum';
import { AccountNotificationProcessor } from './account-notification.processor';
import { AccountNotificationJob } from './notifications.interface';

describe('AccountNotificationProcessor', () => {
  let processor: AccountNotificationProcessor;
  const usersRepository = { findOne: jest.fn() };
  const mailService = { send: jest.fn() };
  const config = { get: jest.fn() };
  const i18n = createI18nMock();
  const job = {
    data: {
      userId: 7,
      template: AccountNotificationTemplate.ACCOUNT_SETUP,
      token: 'abc',
      ttlMinutes: 1440,
      lang: 'vi',
    },
  } as Job<AccountNotificationJob>;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AccountNotificationProcessor,
        { provide: getRepositoryToken(User), useValue: usersRepository },
        { provide: MailService, useValue: mailService },
        { provide: ConfigService, useValue: config },
        { provide: I18nService, useValue: i18n },
      ],
    }).compile();
    processor = moduleRef.get(AccountNotificationProcessor);
  });

  it('emails the token and an optional reset link', async () => {
    usersRepository.findOne.mockResolvedValue({
      id: 7,
      email: 'admin@example.com',
      fullName: 'Admin',
    });
    config.get.mockReturnValue('https://app.example.com/reset-password');

    await processor.process(job);

    expect(i18n.t).toHaveBeenCalledWith('mail.account_setup_body', {
      lang: 'vi',
      args: {
        fullName: 'Admin',
        token: 'abc',
        ttlMinutes: 1440,
        link: 'https://app.example.com/reset-password?token=abc\n\n',
      },
    });
    expect(mailService.send).toHaveBeenCalledWith({
      to: 'admin@example.com',
      subject: 'mail.account_setup_subject',
      text: 'mail.account_setup_body',
    });
  });

  it('skips when the user no longer exists', async () => {
    usersRepository.findOne.mockResolvedValue(null);

    await processor.process(job);

    expect(mailService.send).not.toHaveBeenCalled();
  });
});
