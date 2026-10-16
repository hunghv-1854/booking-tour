import { ConfigService } from '@nestjs/config';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { SMTPS_PORT } from './mail.constants';

export function mailTransportOptions(
  configService: ConfigService,
): SMTPTransport.Options {
  const port = Number(configService.getOrThrow<string>('MAIL_PORT'));
  const user = configService.get<string>('MAIL_USER');
  return {
    host: configService.getOrThrow<string>('MAIL_HOST'),
    port,
    secure: port === SMTPS_PORT,
    auth: user
      ? { user, pass: configService.getOrThrow<string>('MAIL_PASSWORD') }
      : undefined,
  };
}
