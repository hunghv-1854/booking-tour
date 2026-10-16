import { ConfigService } from '@nestjs/config';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { SMTP_TIMEOUT_MS, SMTPS_PORT } from './mail.constants';

export function mailTransportOptions(
  configService: ConfigService,
): SMTPTransport.Options {
  const port = Number(configService.getOrThrow<string>('MAIL_PORT'));
  const user = configService.get<string>('MAIL_USER');
  return {
    host: configService.getOrThrow<string>('MAIL_HOST'),
    port,
    secure: port === SMTPS_PORT,
    connectionTimeout: SMTP_TIMEOUT_MS,
    greetingTimeout: SMTP_TIMEOUT_MS,
    socketTimeout: SMTP_TIMEOUT_MS,
    auth: user
      ? { user, pass: configService.getOrThrow<string>('MAIL_PASSWORD') }
      : undefined,
  };
}
