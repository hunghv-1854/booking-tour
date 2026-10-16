import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';
import { BrevoTransport } from './brevo.transport';
import { mailTransportOptions } from './mail-transport.util';
import { MAIL_TRANSPORTER } from './mail.constants';
import { MailService } from './mail.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: MAIL_TRANSPORTER,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const brevoApiKey = configService.get<string>('BREVO_API_KEY');
        return brevoApiKey
          ? createTransport(new BrevoTransport(brevoApiKey))
          : createTransport(mailTransportOptions(configService));
      },
    },
    MailService,
  ],
  exports: [MailService],
})
export class MailModule {}
